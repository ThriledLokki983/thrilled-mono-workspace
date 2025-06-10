import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
{{#if features.database}}
{{#if (eq database 'mongodb')}}
import { MongooseModule } from '@nestjs/mongoose';
{{else}}
import { TypeOrmModule } from '@nestjs/typeorm';
{{/if}}
{{/if}}
{{#if features.caching}}
import { CacheModule } from '@nestjs/cache-manager';
{{/if}}
import { AppController } from './app.controller';
import { AppService } from './app.service';
{{#if features.authentication}}
import { AuthModule } from './auth/auth.module';
{{/if}}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    {{#if features.database}}
    {{#if (eq database 'mongodb')}}
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/{{kebabCase name}}'),
    {{else}}
    TypeOrmModule.forRoot({
      {{#if (eq database 'postgresql')}}
      type: 'postgres',
      url: process.env.DATABASE_URL,
      {{else if (eq database 'mysql')}}
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || '{{kebabCase name}}',
      {{else if (eq database 'sqlite')}}
      type: 'sqlite',
      database: process.env.DB_FILE || '{{kebabCase name}}.sqlite',
      {{/if}}
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV === 'development',
    }),
    {{/if}}
    {{/if}}
    {{#if features.caching}}
    CacheModule.register({
      ttl: 5000, // 5 seconds
      max: 100, // maximum number of items in cache
      isGlobal: true,
    }),
    {{/if}}
    {{#if features.authentication}}
    AuthModule,
    {{/if}}
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
