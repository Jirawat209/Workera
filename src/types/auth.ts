export type Role = 'owner' | 'admin' | 'member' | 'viewer';

export interface User {
    id: string;
    name: string;
    avatar: string; // URL or Initials
    role: Role;
}
