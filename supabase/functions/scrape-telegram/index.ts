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
    // Remove any existing /s/ first to avoid duplication
    webUrl = webUrl.replace('/s/', '/');
    // Extract channel name and create proper URL
    const channelMatch = webUrl.match(/t\.me\/([a-zA-Z0-9_]+)/);
    if (channelMatch) {
      webUrl = `https://t.me/s/${channelMatch[1]}`;
    } else if (!webUrl.startsWith('https://')) {
      webUrl = `https://t.me/s/${webUrl}`;
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
    
    // Extract images from HTML
    const imageRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
    const images: string[] = [];
    let imgMatch;
    while ((imgMatch = imageRegex.exec(html)) !== null) {
      const src = imgMatch[1];
      if (src && !src.includes('emoji') && !src.includes('icon') && src.includes('telesco.pe')) {
        images.push(src);
      }
    }
    
    // Extract telegram links - filter out the source channel
    const telegramLinkRegex = /https?:\/\/t\.me\/([a-zA-Z0-9_]+)/gi;
    const allLinks: string[] = markdown.match(telegramLinkRegex) || [];
    
    // Get unique links, excluding the source channel
    const sourceChannelMatch = channelUrl.match(/t\.me\/(?:s\/)?([a-zA-Z0-9_]+)/i);
    const sourceChannel = sourceChannelMatch ? sourceChannelMatch[1].toLowerCase() : '';
    
    const uniqueLinks = [...new Set(allLinks)]
      .filter((link: string) => {
        const match = link.match(/t\.me\/([a-zA-Z0-9_]+)/i);
        if (!match) return false;
        const channelName = match[1].toLowerCase();
        return channelName !== sourceChannel && channelName !== 's';
      });
    
    // Clean markdown text - remove image markdown syntax
    const cleanText = (text: string): string => {
      return text
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // Remove ![alt](url)
        .replace(/\[[^\]]*\]\([^)]+\)/g, '') // Remove [text](url)
        .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
        .replace(/[*_#`]/g, '') // Remove markdown formatting
        .replace(/\(\)/g, '') // Remove empty parentheses
        .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
        .trim();
    };
    
    // Split content by posts (usually separated by dividers or dates)
    const postSections = markdown.split(/\n---\n|\n\*\*\*\n|\n_{3,}\n|\n\d{1,2}:\d{2}\n/);
    
    let imageIndex = 0;
    
    for (const link of uniqueLinks) {
      const linkMatch = link.match(/t\.me\/([a-zA-Z0-9_]+)/i);
      if (!linkMatch) continue;
      
      const channelName = linkMatch[1];
      
      // Find the section containing this link
      let postText = '';
      for (const section of postSections) {
        if (section.includes(link) || section.toLowerCase().includes(channelName.toLowerCase())) {
          postText = cleanText(section);
          break;
        }
      }
      
      // If no section found, use a generic text
      if (!postText || postText.length < 10) {
        postText = `لینک ${adType === 'channel' ? 'کانال' : 'گروه'}: @${channelName}`;
      }
      
      // Extract name - use channel name or first meaningful line
      let name = channelName;
      const textLines = postText.split('\n').filter((l: string) => l.trim().length > 3);
      if (textLines.length > 0) {
        const firstLine = textLines[0].trim().slice(0, 50);
        if (firstLine.length > 3 && !/^\d/.test(firstLine)) {
          name = firstLine;
        }
      }
      
      // Extract member count if present
      let members: number | undefined;
      const memberMatch = postText.match(/(\d+(?:[,\s]\d+)*)\s*(عضو|نفر|member|k\s*عضو)/i);
      if (memberMatch) {
        let count = memberMatch[1].replace(/[,\s]/g, '');
        if (memberMatch[2].toLowerCase().includes('k')) {
          members = parseInt(count, 10) * 1000;
        } else {
          members = parseInt(count, 10);
        }
      }
      
      // Use image if available
      const imageUrl = images[imageIndex] || undefined;
      if (imageUrl) imageIndex++;
      
      ads.push({
        name,
        text: postText.slice(0, 500),
        telegramLink: `https://t.me/${channelName}`,
        category: 'chat',
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
