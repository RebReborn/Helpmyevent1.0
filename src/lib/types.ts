

export type ServiceCategory = 'Photography' | 'DJ' | 'Catering' | 'Decor' | 'Planning' | 'Music' | 'Videography';

export type EventType = 'Wedding' | 'Birthday' | 'Corporate' | 'Conference' | 'Party' | 'Other';

export interface Location {
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string;
  bio?: string;
  location?: Location | string; // Keep string for backward compatibility with mock data
  profileType: 'eventPoster' | 'serviceProvider';
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
  // Service Provider fields
  skills?: ServiceCategory[] | string[];
  portfolioImages?: string[];
  experienceLevel?: 'Beginner' | 'Intermediate' | 'Expert';
  availability?: 'Free' | 'Discounted' | 'Paid';
  socialLinks?: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
  };
}


export interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  date?: string; // ISO string - can be undefined from Firestore before hydration
  eventDate: string; // ISO string
  location: Location | string; // Keep string for backward compatibility with mock data
  organizer?: UserProfile; // This will now be fetched separately
  userAccountId: string; // The ID of the organizer
  serviceNeeds: ServiceCategory[] | string[];
  inspirationalImages?: string[];
  imageUrls?: string[];
  isFeatured?: boolean;
  likes?: number;
  comments?: Comment[];
  coverImageUrl?: string;
}

export interface Offer {
    id: string;
    eventID: string;
    eventOwnerId: string;
    serviceProviderProfileId: string;
    description: string;
    price: number;
    status: 'submitted' | 'accepted' | 'rejected';
    createdAt: any; // serverTimestamp
    updatedAt: any; // serverTimestamp
}

export interface Review {
  id: string;
  reviewerUserAccountId: string;
  reviewerName: string;
  reviewerAvatar: string;
  reviewedEntityId: string;
  reviewedEntityType: 'user' | 'event';
  rating: number; // 1-5
  comment: string;
  createdAt: any; // serverTimestamp
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: any; // serverTimestamp
  parentId: string;
  parentType: 'event' | 'post';
}


export interface ServiceProvider extends UserProfile {
    portfolioImages?: string[];
    rating?: number;
    reviews?: Review[];
    followers?: number;
    isAvailableForFree?: boolean;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participants: { [key: string]: Pick<UserProfile, 'name' | 'avatarUrl'> };
  lastMessage?: string;
  lastMessageAt?: any; // serverTimestamp
  updatedAt?: any; // serverTimestamp
  unreadCounts?: { [key: string]: number };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: any; // serverTimestamp
}
