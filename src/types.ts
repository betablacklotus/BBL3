export interface Post {
  slug: string;
  title: string;
  date: string; // ISO date
  excerpt: string;
  content: string; // markdown body
  pinned?: boolean;
  tags?: string[];
  featuredImage?: string;
  socialTitle?: string;
  socialDescription?: string;
  socialImage?: string;
  bunnyVideoId?: string; // for Bunny Stream video embeds
  bunnyAudioId?: string; // for Bunny Stream audio embeds
  bunnyLibraryId?: string; // Bunny library id for embeds
  bandcampTrackId?: string; // Bandcamp numeric track ID for embedded player
  bandcampAlbumId?: string; // Bandcamp numeric album ID for embedded player
}

export interface Page {
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  socialTitle?: string;
  socialDescription?: string;
  socialImage?: string;
  showInHeader?: boolean;
  showInFooter?: boolean;
}

export interface AdminCredentials {
  passwordHash: string;
  salt: string;
}

export interface LoginAttempt {
  timestamp: number;
  ip: string;
  success: boolean;
}

export interface BlockedIP {
  ip: string;
  blockedUntil: number;
  reason: string;
  attempts: number;
}
