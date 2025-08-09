import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Post,
  Res,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import {
  CreateBoatTicketDto,
  CreateBusTicketDto,
  CreateFlightTicketDto,
  CreateTaxiTicketDto,
  CreateTrainTicketDto,
  CreateTramTicketDto,
} from '../ticket/dto';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { Itinerary } from './entities/itinerary.entity';
import { ItineraryService } from './itinerary.service';

@ApiTags('Itineraries')
@ApiExtraModels(
  CreateTrainTicketDto,
  CreateFlightTicketDto,
  CreateTramTicketDto,
  CreateBusTicketDto,
  CreateBoatTicketDto,
  CreateTaxiTicketDto,
)
@Controller('v1/itineraries')
export class ItineraryController {
  private readonly logger = new Logger(ItineraryController.name);

  constructor(private readonly itineraryService: ItineraryService) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create and sort an itinerary from unsorted tickets',
    description:
      'Accepts a set of unsorted tickets, sorts them into a single uninterrupted itinerary, and returns the created itinerary with an identifier.',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Optional idempotency key to safely retry POST requests.',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Itinerary created and sorted successfully',
    type: Itinerary,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The request was invalid (validation or malformed input)',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The request conflicts with the current state',
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description:
      'Business rule violation (e.g., tickets do not form a single uninterrupted path)',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Unexpected server error',
  })
  async createItinerary(
    @Body() createItineraryDto: CreateItineraryDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<Itinerary> {
    this.logger.debug(`Creating itinerary with ${createItineraryDto.tickets.length} tickets`);

    try {
      const result = await this.itineraryService.createItinerary(createItineraryDto, idempotencyKey);

      if (!result.isValid) {
        this.logger.warn(`Itinerary creation failed: ${result.errors.join(', ')}`);
        
        this.handleSortingErrors(result);
      }

      // Log warnings if any
      if (result.warnings.length > 0) {
        this.logger.warn(`Itinerary created with warnings: ${result.warnings.join(', ')}`);
      }

      this.logger.log(`Successfully created itinerary ${result.itinerary!.id}`);
      return result.itinerary!;

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Unexpected error creating itinerary', error);
      throw new InternalServerErrorException({
        message: 'An unexpected error occurred while creating the itinerary',
        error: error.message,
      });
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve an itinerary by id',
    description:
      'Returns the itinerary in JSON. Set Accept: text/plain to receive the human-readable version.',
  })
  @ApiParam({
    name: 'id',
    description: 'Itinerary ID',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Itinerary found',
    type: Itinerary,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The requested resource was not found',
  })
  async getItinerary(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Itinerary | string> {
    this.logger.debug(`Retrieving itinerary: ${id}`);

    try {
      const itinerary = await this.itineraryService.findItineraryById(id);
      
      if (!itinerary) {
        throw new NotFoundException({
          message: 'Itinerary not found',
          error: `No itinerary found with ID: ${id}`,
        });
      }

      // Check Accept header for text/plain response
      const acceptHeader = res.req.headers.accept;
      if (acceptHeader === 'text/plain') {
        res.header('Content-Type', 'text/plain');
        
        const humanSteps = await this.itineraryService.getHumanReadableItinerary(id);
        if (!humanSteps) {
          throw new InternalServerErrorException({
            message: 'Unable to generate human-readable format',
          });
        }
        
        return humanSteps.join('\n');
      }

      this.logger.debug(`Successfully retrieved itinerary: ${id}`);
      return itinerary;

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Error retrieving itinerary: ${id}`, error);
      throw new InternalServerErrorException({
        message: 'An unexpected error occurred while retrieving the itinerary',
        error: error.message,
      });
    }
  }

  @Get(':id/human')
  @ApiOperation({
    summary: 'Retrieve an itinerary in human-readable form',
    description:
      'Convenience endpoint for plain text rendering of an itinerary',
  })
  @ApiParam({
    name: 'id',
    description: 'Itinerary ID',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Human-readable itinerary',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
        },
      },
    },
  })
  @Header('Content-Type', 'text/plain')
  async getItineraryHuman(@Param('id') id: string): Promise<string> {
    this.logger.debug(`Retrieving human-readable itinerary: ${id}`);

    try {
      const humanSteps = await this.itineraryService.getHumanReadableItinerary(id);
      
      if (!humanSteps) {
        throw new NotFoundException({
          message: 'Itinerary not found',
          error: `No itinerary found with ID: ${id}`,
        });
      }

      this.logger.debug(`Successfully retrieved human-readable itinerary: ${id}`);
      return humanSteps.join('\n');

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Error retrieving human-readable itinerary: ${id}`, error);
      throw new InternalServerErrorException({
        message: 'An unexpected error occurred while retrieving the itinerary',
        error: error.message,
      });
    }
  }

  /**
   * Helper method to handle sorting errors and throw appropriate HTTP exceptions
   */
  private handleSortingErrors(result: { errors: string[]; warnings: string[] }): never {
    if (this.hasValidationErrors(result.errors)) {
      throw new BadRequestException({
        message: 'Invalid input data',
        errors: result.errors,
        warnings: result.warnings,
      });
    }

    if (this.hasBusinessRuleErrors(result.errors)) {
      throw new UnprocessableEntityException({
        message: 'Tickets do not form a valid itinerary',
        errors: result.errors,
        warnings: result.warnings,
      });
    }

    throw new InternalServerErrorException({
      message: 'Unable to process itinerary',
      errors: result.errors,
    });
  }

  /**
   * Check if errors contain validation-related issues
   */
  private hasValidationErrors(errors: string[]): boolean {
    return errors.some(error => 
      error.toLowerCase().includes('required') || 
      error.toLowerCase().includes('invalid') || 
      error.toLowerCase().includes('empty')
    );
  }

  /**
   * Check if errors contain business rule violations
   */
  private hasBusinessRuleErrors(errors: string[]): boolean {
    return errors.some(error => 
      error.toLowerCase().includes('route') || 
      error.toLowerCase().includes('path') || 
      error.toLowerCase().includes('connection') ||
      error.toLowerCase().includes('circular') ||
      error.toLowerCase().includes('multiple') ||
      error.toLowerCase().includes('branch')
    );
  }
}
