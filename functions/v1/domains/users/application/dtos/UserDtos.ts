export interface CreateUserDto {
  id: string;
  email: string;
  phone: string;
  name?: string;
  photoUrl?: string;
}

export interface UpdateUserDto {
  name?: string;
  photoUrl?: string;
}
