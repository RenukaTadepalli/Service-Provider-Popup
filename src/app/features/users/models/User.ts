// export interface User {
//   Id?: number;
//   Firstname: string;
//   Lastname: string;
//   UserEmail: string;
//   PhoneNumber: string;
//   MobileNumber: string;
//   EmployeeId?: string;
//   IsActive: boolean;
//   IsAdmin: boolean;
//   ProfileImage?: string;
//   UserName: string;
//   PasswordHash: string;
//   EmailConfirmed: boolean;
//   SecurityStamp?: string;
//   createdByUserId?: number;
//   createdDate?: Date;
//   modifiedDate?: Date;
//   IsDeleted?: boolean;
// }


export interface User {
  AspNetUserId?: number; // Backend primary key
  UserName: string;
  UserEmail: string;
  PhoneNumber?: string;
  MobileNumber?: string;
  EmployeeId?: string;
  Firstname: string;
  Lastname: string;
  PasswordHash?: string;
  SecurityStamp?: string;
  ProfileImage?: string; // Base64 string
  IsActive: boolean;
  IsAdmin: boolean;
  EmailConfirmed: boolean;
  IsDeleted?: boolean;
  Roles?:string[];
}

