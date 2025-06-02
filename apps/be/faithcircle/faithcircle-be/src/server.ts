import app from './app';

const port = process.env.PORT || 8888;

const server = app.listen(port, () => {
  console.log(
    `🚀 FaithCircle Backend API listening at http://localhost:${port}`
  );
  console.log(
    `📊 Health check available at http://localhost:${port}/api/health`
  );
  console.log(`🌐 Main API endpoint: http://localhost:${port}/api`);
});

server.on('error', (error: Error) => {
  console.error('❌ Server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

export default server;
