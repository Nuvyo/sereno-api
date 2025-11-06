module.exports = {
  target: 'node',
  entry: './dist/main.js',
  externals: {
    '@nestjs/microservices': '@nestjs/microservices',
    '@nestjs/websockets': '@nestjs/websockets',
    'class-transformer/storage': 'class-transformer/storage'
  }
};