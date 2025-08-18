export class User {
  id: string;
  // name: string;
  // firstName: string;
  // lastName: string;
  // email: string;
  // picture: string;
  username?: string; // Add this line

  constructor({
    id,
    // name,
    // firstName,
    // lastName,
    // email,
    // picture,
    username,
  }: {
    id: string;
    // name: string;
    // firstName: string;
    // lastName: string;
    // email: string;
    // picture: string;
    username?: string; // Optional in constructor too

  }) {
    this.id = id;
    // this.name = name;
    // this.firstName = firstName;
    // this.lastName = lastName;
    // this.email = email;
    // this.picture = picture;
    this.username = username;
  }

  // getFullName(): string {
  //   return `${this.firstName} ${this.lastName}`;
  // }
}
