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
    webUrl = webUrl.replace('/s/', '/');
    const channelMatch = webUrl.match(/t\.me\/([a-zA-Z0-9_]+)/);
    if (channelMatch) {
      webUrl = `https://t.me/s/${channelMatch[1]}`;
    } else if (!webUrl.startsWith('https://')) {
      webUrl = `https://t.me/s/${webUrl}`;
    }

    console.log('Scraping Telegram channel:', webUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webUrl,
        formats: ['markdown', 'html', 'links'],
        onlyMainContent: false,
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
    
    console.log('HTML length:', html.length, 'Markdown length:', markdown.length);
    
    const ads: ScrapedAd[] = [];
    
    // Extract images from HTML - telesco.pe images
    const imageRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
    const allImages: string[] = [];
    let imgMatch;
    while ((imgMatch = imageRegex.exec(html)) !== null) {
      const src = imgMatch[1];
      if (src && !src.includes('emoji') && !src.includes('icon') && 
          (src.includes('telesco.pe') || src.includes('cdn') || src.includes('telegram'))) {
        allImages.push(src);
      }
    }
    
    console.log('Found images:', allImages.length);
    
    // Get source channel to exclude
    const sourceChannelMatch = channelUrl.match(/t\.me\/(?:s\/)?([a-zA-Z0-9_]+)/i);
    const sourceChannel = sourceChannelMatch ? sourceChannelMatch[1].toLowerCase() : '';
    
    // Extract ALL telegram links including invite links (t.me/+XXXX or t.me/joinchat/XXXX)
    const inviteLinkRegex = /https?:\/\/t\.me\/(?:\+|joinchat\/)[a-zA-Z0-9_-]+/gi;
    const channelLinkRegex = /https?:\/\/t\.me\/([a-zA-Z0-9_]+)(?![a-zA-Z0-9_+])/gi;
    
    const inviteLinks = markdown.match(inviteLinkRegex) || [];
    const channelLinks = (markdown.match(channelLinkRegex) || [])
      .filter((link: string) => {
        const match = link.match(/t\.me\/([a-zA-Z0-9_]+)/i);
        if (!match) return false;
        const name = match[1].toLowerCase();
        return name !== sourceChannel && name !== 's' && name.length > 2;
      });
    
    // Combine all links
    const allLinks = [...new Set([...inviteLinks, ...channelLinks])];
    
    console.log('Found invite links:', inviteLinks.length, 'Channel links:', channelLinks.length);
    
    // Split markdown by message blocks (look for date/time patterns or separators)
    const messageBlocks = markdown.split(/(?=\d{1,2}:\d{2}\s*$)/m);
    
    let imageIndex = 0;
    
    for (const link of allLinks) {
      // Find the block containing this link
      let postText = '';
      let postImage = '';
      
      for (const block of messageBlocks) {
        if (block.includes(link)) {
          postText = block;
          break;
        }
      }
      
      // If not found in blocks, search in full markdown around the link
      if (!postText) {
        const linkIndex = markdown.indexOf(link);
        if (linkIndex !== -1) {
          const start = Math.max(0, linkIndex - 500);
          const end = Math.min(markdown.length, linkIndex + 200);
          postText = markdown.slice(start, end);
        }
      }
      
      // Clean the text
      const cleanText = postText
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // Remove ![alt](url)
        .replace(/\[[^\]]*\]\([^)]+\)/g, '') // Remove [text](url)
        .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
        .replace(/[*_#`]/g, '') // Remove markdown formatting
        .replace(/\(\)/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      // Extract name from first meaningful line (usually the group name with emoji)
      const lines = cleanText.split('\n').filter(l => l.trim().length > 2);
      let name = 'آگهی تلگرام';
      
      for (const line of lines) {
        const trimmed = line.trim();
        // Skip lines that are just numbers, times, or very short
        if (!/^\d+$/.test(trimmed) && !/^\d{1,2}:\d{2}$/.test(trimmed) && trimmed.length > 3) {
          name = trimmed.slice(0, 60);
          break;
        }
      }
      
      // Extract member count
      let members: number | undefined;
      const memberMatch = cleanText.match(/(\d+(?:[,\s]\d+)*)\s*(عضو|نفر|member)/i);
      if (memberMatch) {
        members = parseInt(memberMatch[1].replace(/[,\s]/g, ''), 10);
      }
      
      // Get image for this ad
      const imageUrl = allImages[imageIndex] || undefined;
      if (allImages.length > 0) {
        imageIndex = (imageIndex + 1) % allImages.length;
      }
      
      ads.push({
        name,
        text: cleanText.slice(0, 500) || `لینک ${adType === 'channel' ? 'کانال' : 'گروه'}`,
        telegramLink: link,
        category: 'chat',
        adType: adType as 'group' | 'channel',
        members,
        imageUrl,
      });
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
