import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Itinerary Plus API')
    .setDescription(
      `API for sorting travel tickets into a complete itinerary and rendering a human-readable version.

**Contract-first design** to enable parallel development and mocking. No authentication in v1.

**Error Handling Philosophy:**
This API prioritizes **detailed, actionable error messages** over generic responses. When tickets cannot form a valid itinerary, the API provides:
- **Specific analysis** of what's wrong with the route structure
- **Actionable suggestions** for fixing the issues
- **Detailed explanations** of disconnected segments, circular routes, or other problems
- **Warnings** for potential issues that don't prevent processing

**Common Use Cases:**
- Sort unsorted travel tickets into a logical sequence
- Generate human-readable travel instructions
- Validate that tickets form a complete, uninterrupted journey
- Identify missing connections in travel plans`,
    )
    .setVersion('1.0.0')
    .addTag('Itineraries', 'Create and retrieve itineraries')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
