import type { User, ServiceProvider, Event, Review, Location } from './types';
import { PlaceHolderImages } from './placeholder-images';

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || `https://picsum.photos/seed/${id}/200/200`;

const sunnyvaleLocation: Location = { city: 'Sunnyvale, CA', country: 'USA', lat: 37.3688, lng: -122.0363 };
const sfLocation: Location = { city: 'San Francisco, CA', country: 'USA', lat: 37.7749, lng: -122.4194 };
const oaklandLocation: Location = { city: 'Oakland, CA', country: 'USA', lat: 37.8044, lng: -122.2712 };
const paloAltoLocation: Location = { city: 'Palo Alto, CA', country: 'USA', lat: 37.4419, lng: -122.1430 };


export const mockUsers: User[] = [
  { id: 'u1', name: 'Alice Johnson', avatarUrl: findImage('user-1'), bio: 'Event enthusiast planning my dream wedding.' },
  { id: 'u2', name: 'Bob Williams', avatarUrl: findImage('user-2'), bio: 'Corporate event manager looking for fresh talent.' },
  { id: 'u3', name: 'Charlie Brown', avatarUrl: findImage('user-3'), bio: 'Aspiring photographer building my portfolio.' },
  { id: 'u4', name: 'Diana Miller', avatarUrl: findImage('user-4'), bio: 'Experienced DJ ready to rock your party.' },
];

export const mockReviews: Review[] = [
    { id: 'r1', author: mockUsers[0], rating: 5, comment: 'Absolutely amazing work! Transformed our venue.', createdAt: '2023-10-15T14:48:00.000Z' },
    { id: 'r2', author: mockUsers[1], rating: 4, comment: 'Very professional and creative. A pleasure to work with.', createdAt: '2023-11-20T18:20:00.000Z' },
];

export const mockServiceProviders: ServiceProvider[] = [
  {
    id: 'sp1',
    name: 'Creative Captures',
    avatarUrl: findImage('user-3'),
    bio: 'Passionate photographer specializing in capturing candid moments. Eager to collaborate on unique events to expand my portfolio.',
    skills: ['Photography', 'Videography'],
    portfolioImages: [findImage('portfolio-1-1'), findImage('portfolio-1-2'), 'https://picsum.photos/seed/p13/400/300'],
    experienceLevel: 'Intermediate',
    isAvailableForFree: true,
    rating: 4.8,
    reviews: mockReviews,
    followers: 120,
    location: sfLocation,
  },
  {
    id: 'sp2',
    name: 'Gourmet Gatherings',
    avatarUrl: findImage('user-4'),
    bio: 'Innovative catering service focusing on farm-to-table cuisine. We bring a taste of elegance to any event.',
    skills: ['Catering', 'Planning'],
    portfolioImages: [findImage('portfolio-2-1'), findImage('portfolio-2-2'), 'https://picsum.photos/seed/p23/400/300'],
    experienceLevel: 'Expert',
    isAvailableForFree: false,
    rating: 4.9,
    reviews: [mockReviews[0]],
    followers: 450,
    location: paloAltoLocation,
  },
];

export const mockEvents: Event[] = [
  {
    id: 'evt1',
    userAccountId: 'u1',
    title: 'Rustic Barn Wedding',
    description: 'We are looking for passionate creators to help bring our dream rustic barn wedding to life. We need a photographer and a decorator to capture and create a magical atmosphere. This is a great opportunity to build your portfolio with a beautiful countryside event.',
    type: 'Wedding',
    eventDate: '2024-08-12T14:00:00.000Z',
    location: sunnyvaleLocation,
    organizer: mockUsers[0],
    serviceNeeds: ['Photography', 'Decor'],
    imageUrls: [findImage('inspirational-1'), findImage('inspirational-2')],
    isFeatured: true,
    likes: 152,
    comments: [
        { id: 'c1', authorId: 'u3', authorName: 'Charlie Brown', authorAvatar: findImage('user-3'), content: 'Sent you an offer! My style would be a perfect fit.', createdAt: { seconds: 1621511400, nanoseconds: 0 } }
    ],
    coverImageUrl: findImage('event-cover-1'),
  },
  {
    id: 'evt2',
    userAccountId: 'u2',
    title: 'Tech Startup Launch Party',
    description: 'Our tech startup is hosting a launch party and we need a DJ and a videographer to make it unforgettable. Join us to network and showcase your skills to an audience of tech innovators and investors.',
    type: 'Corporate',
    eventDate: '2024-09-05T18:00:00.000Z',
    location: sfLocation,
    organizer: mockUsers[1],
    serviceNeeds: ['DJ', 'Videography'],
    imageUrls: ['https://picsum.photos/seed/insp3/400/300', 'https://picsum.photos/seed/insp4/400/300'],
    isFeatured: true,
    likes: 89,
    comments: [],
    coverImageUrl: findImage('event-cover-3'),
  },
  {
    id: 'evt3',
    userAccountId: 'u1',
    title: 'Indie Music Night',
    description: 'An intimate evening of live indie music. We are searching for up-and-coming musicians and bands to perform. A great chance to gain exposure and connect with music lovers.',
    type: 'Party',
    eventDate: '2024-07-25T19:00:00.000Z',
    location: oaklandLocation,
    organizer: mockUsers[0],
    serviceNeeds: ['Music'],
    imageUrls: [],
    isFeatured: false,
    likes: 45,
    comments: [],
    coverImageUrl: findImage('event-cover-4'),
  },
  {
    id: 'evt4',
    userAccountId: 'u2',
    title: 'Milestone 30th Birthday Bash',
    description: 'Planning a huge 30th birthday celebration! Looking for a caterer who can handle a fun, themed menu and a photographer to capture all the great moments. Let\'s make this party legendary!',
    type: 'Birthday',
    eventDate: '2024-10-19T17:00:00.000Z',
    location: paloAltoLocation,
    organizer: mockUsers[1],
    serviceNeeds: ['Catering', 'Photography'],
    imageUrls: [],
    isFeatured: false,
    likes: 62,
    comments: [],
    coverImageUrl: findImage('event-cover-2'),
  }
];
