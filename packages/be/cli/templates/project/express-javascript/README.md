# {{name}}

{{description}}

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
{{#if features.database}}
{{#if (eq database 'postgresql')}}
- PostgreSQL
{{else if (eq database 'mysql')}}
- MySQL
{{else if (eq database 'mongodb')}}
- MongoDB
{{/if}}
{{/if}}

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd {{kebabCase name}}
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

{{#if features.database}}
4. Set up the database
{{#if (eq database 'postgresql')}}
```bash
# Create PostgreSQL database
createdb {{kebabCase name}}
```
{{else if (eq database 'mysql')}}
```bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE {{underscore name}};"
```
{{else if (eq database 'mongodb')}}
```bash
# MongoDB will create the database automatically
```
{{/if}}
{{/if}}

### Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint

## Project Structure

```
src/
├── index.js          # Main application file
├── routes/           # Route definitions
├── middleware/       # Custom middleware
├── models/           # Data models
├── controllers/      # Route controllers
├── services/         # Business logic
└── utils/            # Utility functions
```

## Environment Variables

```env
PORT=3000
NODE_ENV=development
{{#if features.database}}
{{#if (eq database 'postgresql')}}
DATABASE_URL=postgresql://user:password@localhost:5432/{{kebabCase name}}
{{else if (eq database 'mysql')}}
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME={{underscore name}}
{{else if (eq database 'sqlite')}}
DB_FILE=./{{kebabCase name}}.sqlite
{{else if (eq database 'mongodb')}}
MONGODB_URI=mongodb://localhost:27017/{{kebabCase name}}
{{/if}}
{{/if}}
{{#if features.authentication}}
JWT_SECRET=your-super-secret-jwt-key
{{/if}}
```

## License

{{license}}
