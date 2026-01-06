const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedAd {
  name: string;
  text: string;
  telegramLink: string;
  category: string;
  adType: 'group' | 'channel';
  members?: number;
  imageUrl?: string;
  date?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channelUrl, adType = 'group' } = await req.json();

    if (!channelUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Channel URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Scraper not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format channel URL for web preview
    let webUrl = channelUrl.trim();
    if (webUrl.startsWith('https://t.me/')) {
      webUrl = webUrl.replace('https://t.me/', 'https://t.me/s/');
    } else if (!webUrl.includes('/s/')) {
      webUrl = webUrl.replace('t.me/', 't.me/s/');
    }

    console.log('Scraping Telegram channel:', webUrl);

    // Scrape the channel page with images
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webUrl,
        formats: ['markdown', 'html', 'links'],
        onlyMainContent: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || 'Scrape failed' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = data.data?.html || data.html || '';
    const markdown = data.data?.markdown || data.markdown || '';
    
    // Parse posts from HTML - each post is typically in a message container
    const ads: ScrapedAd[] = [];
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Split by common Telegram post separators in markdown
    const posts = markdown.split(/\n---\n|\n\*\*\*\n|\n_{3,}\n/);
    
    // Also try to extract images from HTML
    const imageRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
    const images: string[] = [];
    let imgMatch;
    while ((imgMatch = imageRegex.exec(html)) !== null) {
      const src = imgMatch[1];
      if (src && !src.includes('emoji') && !src.includes('icon')) {
        images.push(src);
      }
    }
    
    // Extract telegram links
    const telegramLinkRegex = /https?:\/\/t\.me\/[a-zA-Z0-9_]+/gi;
    
    let imageIndex = 0;
    
    for (const post of posts) {
      const trimmed = post.trim();
      if (trimmed.length < 20) continue;
      
    // Find telegram links in this post
      const links: string[] = trimmed.match(telegramLinkRegex) || [];
      const telegramLink = links.find((l: string) => !l.includes('/s/')) || '';
      
      if (!telegramLink) continue;
      
      // Check for date in post (Telegram posts often have dates)
      // For now, include all posts and let frontend filter
      
      // Extract name from first line
      const lines = trimmed.split('\n').filter((l: string) => l.trim());
      let name = lines[0]?.replace(/[#*_\[\]`]/g, '').trim().slice(0, 50) || '';
      
      // If name looks like a date or is too short, try second line
      if (name.length < 5 || /^\d/.test(name)) {
        name = lines[1]?.replace(/[#*_\[\]`]/g, '').trim().slice(0, 50) || name;
      }
      
      // Clean the text
      let text = trimmed
        .replace(telegramLinkRegex, '')
        .replace(/[#*_\[\]`]/g, '')
        .trim()
        .slice(0, 500);
      
      if (text.length < 20) continue;
      
      // Extract member count if present
      let members: number | undefined;
      const memberMatch = text.match(/(\d+(?:[,\s]\d+)*)\s*(عضو|نفر|member)/i);
      if (memberMatch) {
        members = parseInt(memberMatch[1].replace(/[,\s]/g, ''), 10);
      }
      
      // Use image if available
      const imageUrl = images[imageIndex] || undefined;
      if (imageUrl) imageIndex++;
      
      // If no name found, extract from telegram link
      if (!name || name.length < 3) {
        const linkMatch = telegramLink.match(/t\.me\/([a-zA-Z0-9_]+)/);
        name = linkMatch ? linkMatch[1] : 'آگهی تلگرام';
      }
      
      ads.push({
        name,
        text,
        telegramLink,
        category: 'chat', // Default category
        adType: adType as 'group' | 'channel',
        members,
        imageUrl,
      });
    }
    
    // If no structured posts found, try to extract from raw content
    if (ads.length === 0) {
      const allLinks: string[] = markdown.match(telegramLinkRegex) || [];
      const uniqueLinks = [...new Set(allLinks)].filter((l: string) => !l.includes('/s/'));
      
      for (const link of uniqueLinks.slice(0, 20)) {
        const linkMatch = link.match(/t\.me\/([a-zA-Z0-9_]+)/);
        const name = linkMatch ? linkMatch[1] : 'آگهی تلگرام';
        
        ads.push({
          name,
          text: `لینک ${adType === 'channel' ? 'کانال' : 'گروه'}: ${link}`,
          telegramLink: link,
          category: 'chat',
          adType: adType as 'group' | 'channel',
          imageUrl: images[ads.length] || undefined,
        });
      }
    }

    console.log(`Found ${ads.length} ads from channel`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ads: ads.slice(0, 30), // Limit to 30 ads
        channelUrl: webUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error scraping:', error);
    const errorMessage = error instanceof Error ? error.message : 'Scrape failed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
