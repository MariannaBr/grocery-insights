# Grocery Insights

A Next.js application that helps users track and analyze their grocery shopping habits by processing and analyzing receipts.

## Features

- User authentication with Firebase
- Receipt upload and processing
- Shopping insights and analytics
- Responsive design with Tailwind CSS

## Tech Stack

- [Next.js 14](https://nextjs.org/)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin)
- [Prisma](https://www.prisma.io/) with PostgreSQL
- [Tailwind CSS](https://tailwindcss.com/)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/grocery-insights.git
cd grocery-insights
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:

```env
# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/grocery_insights"

# OpenAI (for receipt processing)
OPENAI_API_KEY=your-openai-api-key
```

4. Set up the database:

```bash
npx prisma migrate dev
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Firebase Setup

1. Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Email/Password authentication in the Firebase Console
3. Generate a new private key for the Firebase Admin SDK:
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file and use its values in your `.env` file

## Database Schema

The application uses Prisma with PostgreSQL. The main models are:

- User: Stores user information
- Receipt: Stores receipt data and processing status
- Item: Stores individual items from receipts

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
