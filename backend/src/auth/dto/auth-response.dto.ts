// backend/src/auth/dto/auth-response.dto.ts
export class AuthResponseDto {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    fullName: string;
  };
  accessToken: string;
}
