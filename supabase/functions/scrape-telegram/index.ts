const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramPost {
  text: string;
  link?: string;
  date?: string;
}

interface ScrapedAd {
  name: string;
  text: string;
  telegramLink: string;
  category: string;
  adType: 'group' | 'channel';
  members?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channelUrl } = await req.json();

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

    // Scrape the channel page
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webUrl,
        formats: ['markdown', 'links'],
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

    // Parse the scraped content to extract ads
    const markdown = data.data?.markdown || data.markdown || '';
    const links = data.data?.links || data.links || [];
    
    // Extract Telegram links from content
    const telegramLinks: string[] = [];
    const linkRegex = /https?:\/\/t\.me\/[^\s\)\]]+/g;
    const foundLinks = markdown.match(linkRegex) || [];
    telegramLinks.push(...foundLinks);
    
    // Also get links from the links array
    links.forEach((link: string) => {
      if (link.includes('t.me/') && !link.includes('/s/')) {
        telegramLinks.push(link);
      }
    });

    // Remove duplicates and filter
    const uniqueLinks = [...new Set(telegramLinks)]
      .filter(link => !link.includes('/s/'))
      .slice(0, 20); // Limit to 20 ads per scrape

    // Parse ads from content
    const ads: ScrapedAd[] = [];
    const sections = markdown.split(/\n{2,}/);
    
    for (const section of sections) {
      const trimmed = section.trim();
      if (trimmed.length < 20) continue;
      
      // Try to find a telegram link in this section
      const sectionLinks = trimmed.match(linkRegex);
      if (!sectionLinks || sectionLinks.length === 0) continue;
      
      const telegramLink = sectionLinks.find((l: string) => !l.includes('/s/'));
      if (!telegramLink) continue;
      
      // Extract name (first line or first sentence)
      const lines = trimmed.split('\n').filter((l: string) => l.trim());
      const name = lines[0]?.replace(/[#*_\[\]]/g, '').trim().slice(0, 50) || 'آگهی جدید';
      
      // Clean text
      const text = trimmed
        .replace(linkRegex, '')
        .replace(/[#*_\[\]]/g, '')
        .trim()
        .slice(0, 300);
      
      if (text.length < 20) continue;
      
      // Detect if it's a group or channel
      const isChannel = telegramLink.toLowerCase().includes('channel') || 
                       trimmed.toLowerCase().includes('کانال') ||
                       trimmed.toLowerCase().includes('channel');
      
      ads.push({
        name: name || 'آگهی تلگرام',
        text,
        telegramLink,
        category: 'social', // Default category
        adType: isChannel ? 'channel' : 'group',
        members: undefined,
      });
    }

    console.log(`Found ${ads.length} ads from channel`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ads,
        totalLinks: uniqueLinks.length,
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
