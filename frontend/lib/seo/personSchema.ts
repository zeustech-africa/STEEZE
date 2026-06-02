interface CreatorProfile {
  artistName: string;
  email: string;
  description?: string;
  profilePicUrl?: string;
  userType: string;
  followers?: number;
  createdAt?: string;
  socialLinks?: Record<string, string>;
}

export function generatePersonSchema(creator: CreatorProfile, baseUrl: string) {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: creator.artistName,
    email: creator.email,
    description: creator.description || `${creator.artistName} on STEEZE`,
    image: creator.profilePicUrl || `${baseUrl}/icons/steeze-icon-512x512.png`,
    url: `${baseUrl}/creator/${creator.artistName.toLowerCase().replace(/\s/g, '-')}`,
    sameAs: Object.values(creator.socialLinks || {}).filter(Boolean),
    jobTitle: creator.userType === 'zls_artist' ? 'ZLS Signed Artist' : 'Independent Creator',
    worksFor: {
      '@type': 'Organization',
      name: 'STEEZE',
      url: baseUrl
    }
  };

  if (creator.followers) {
    schema.interactionStatistic = {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/FollowAction',
      userInteractionCount: creator.followers
    };
  }

  return schema;
}

export function generateWebSiteSchema(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'STEEZE',
    url: baseUrl,
    description: 'South African creator platform for music, content, and community',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}

export function generateProductSchema(plan: { name: string; price: number; currency: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${plan.name} Subscription`,
    description: `Monthly subscription to access exclusive creator content on STEEZE`,
    offers: {
      '@type': 'Offer',
      price: plan.price,
      priceCurrency: plan.currency,
      availability: 'https://schema.org/OnlineOnly',
      validFrom: new Date().toISOString()
    },
    audience: {
      '@type': 'Audience',
      name: 'STEEZE Subscribers'
    }
  };
}