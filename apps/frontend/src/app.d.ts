declare global {
  namespace App {
    interface Locals {
      user: {
        id: string;
        username: string;
        role: string;
        name: string;
      } | null;
    }
  }
}

export {};
