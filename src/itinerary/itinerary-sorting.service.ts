import { Injectable, Logger } from '@nestjs/common';
import { Place } from '../place/entities/place.entity';
import { Ticket } from '../ticket/entities/ticket.entity';

export interface SortingResult {
  sortedTickets: Ticket[];
  startPlace: Place | null;
  endPlace: Place | null;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RouteGraph {
  nodes: Map<string, Place>;
  edges: Map<string, Ticket[]>; // from place ID -> tickets from that place
  inDegree: Map<string, number>; // place ID -> number of incoming connections
  outDegree: Map<string, number>; // place ID -> number of outgoing connections
}

@Injectable()
export class ItinerarySortingService {
  private readonly logger = new Logger(ItinerarySortingService.name);

  /**
   * Main method to sort an array of unordered tickets into a valid itinerary
   */
  async sortTickets(tickets: Ticket[]): Promise<SortingResult> {
    this.logger.debug(`Sorting ${tickets.length} tickets into itinerary`);

    const result: SortingResult = {
      sortedTickets: [],
      startPlace: null,
      endPlace: null,
      isValid: false,
      errors: [],
      warnings: [],
    };

    try {
      // Step 1: Basic validation
      const basicValidation = this.validateBasicRequirements(tickets);
      if (!basicValidation.isValid) {
        result.errors = basicValidation.errors;
        return result;
      }

      // Step 2: Build route graph
      const graph = this.buildRouteGraph(tickets);
      this.logger.debug(`Built graph with ${graph.nodes.size} places and ${tickets.length} connections`);

      // Step 3: Validate graph structure
      const graphValidation = this.validateGraphStructure(graph);
      if (!graphValidation.isValid) {
        result.errors = graphValidation.errors;
        result.warnings = graphValidation.warnings;
        return result;
      }

      // Step 4: Find start and end places
      const endpoints = this.findStartAndEndPlaces(graph);
      if (!endpoints.isValid) {
        result.errors = endpoints.errors;
        return result;
      }

      // Step 5: Sort tickets by traversing the graph
      if (!endpoints.startPlace) {
        result.errors.push('Start place is required for sorting');
        return result;
      }

      const sortingResult = this.traverseGraphToSort(graph, endpoints.startPlace);
      if (!sortingResult.isValid) {
        result.errors = sortingResult.errors;
        return result;
      }

      // Step 6: Final validation
      const finalValidation = this.validateSortedSequence(sortingResult.sortedTickets);
      if (!finalValidation.isValid) {
        result.errors = finalValidation.errors;
        return result;
      }

      // Success!
      result.sortedTickets = sortingResult.sortedTickets;
      result.startPlace = endpoints.startPlace;
      result.endPlace = endpoints.endPlace || null;
      result.isValid = true;
      result.warnings = [...graphValidation.warnings, ...finalValidation.warnings];

      this.logger.log(`Successfully sorted ${tickets.length} tickets from ${result.startPlace.name} to ${result.endPlace?.name || 'unknown'}`);
      return result;

    } catch (error) {
      this.logger.error('Unexpected error during ticket sorting', error);
      result.errors.push(`Unexpected error: ${error.message}`);
      return result;
    }
  }

  /**
   * Validate basic requirements for sorting
   */
  private validateBasicRequirements(tickets: Ticket[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!tickets || tickets.length === 0) {
      errors.push('No tickets provided for sorting');
    }

    if (tickets.length === 1) {
      // Single ticket is always valid
      return { isValid: true, errors: [] };
    }

    // Check that all tickets have valid from/to places
    tickets.forEach((ticket, index) => {
      if (!ticket.from || !ticket.from.id) {
        errors.push(`Ticket ${index + 1} has invalid 'from' place`);
      }
      if (!ticket.to || !ticket.to.id) {
        errors.push(`Ticket ${index + 1} has invalid 'to' place`);
      }
      if (ticket.from?.id && ticket.to?.id && ticket.from.id === ticket.to.id) {
        errors.push(`Ticket ${index + 1} has same 'from' and 'to' place: ${ticket.from.name}`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Build a directed graph from the tickets
   */
  private buildRouteGraph(tickets: Ticket[]): RouteGraph {
    const graph: RouteGraph = {
      nodes: new Map(),
      edges: new Map(),
      inDegree: new Map(),
      outDegree: new Map(),
    };

    // Add all places as nodes and initialize degrees
    tickets.forEach(ticket => {
      if (!ticket.from?.id || !ticket.to?.id) {
        return; // Skip invalid tickets
      }

      // Add nodes
      graph.nodes.set(ticket.from.id, ticket.from);
      graph.nodes.set(ticket.to.id, ticket.to);

      // Initialize degrees
      if (!graph.inDegree.has(ticket.from.id)) {
        graph.inDegree.set(ticket.from.id, 0);
        graph.outDegree.set(ticket.from.id, 0);
      }
      if (!graph.inDegree.has(ticket.to.id)) {
        graph.inDegree.set(ticket.to.id, 0);
        graph.outDegree.set(ticket.to.id, 0);
      }
    });

    // Add edges and update degrees
    tickets.forEach(ticket => {
      if (!ticket.from?.id || !ticket.to?.id) {
        return; // Skip invalid tickets
      }

      // Add edge
      if (!graph.edges.has(ticket.from.id)) {
        graph.edges.set(ticket.from.id, []);
      }
      graph.edges.get(ticket.from.id)!.push(ticket);

      // Update degrees
      const currentOutDegree = graph.outDegree.get(ticket.from.id) || 0;
      const currentInDegree = graph.inDegree.get(ticket.to.id) || 0;
      graph.outDegree.set(ticket.from.id, currentOutDegree + 1);
      graph.inDegree.set(ticket.to.id, currentInDegree + 1);
    });

    return graph;
  }

  /**
   * Validate the graph structure for a valid path
   */
  private validateGraphStructure(graph: RouteGraph): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Count places with different degree patterns
    let startCandidates = 0; // outDegree > inDegree
    let endCandidates = 0;   // inDegree > outDegree
    let isolatedPlaces = 0;  // both degrees = 0
    let balancedPlaces = 0;  // inDegree = outDegree

    graph.nodes.forEach((place, placeId) => {
      const inDeg = graph.inDegree.get(placeId) || 0;
      const outDeg = graph.outDegree.get(placeId) || 0;

      if (inDeg === 0 && outDeg === 0) {
        isolatedPlaces++;
        errors.push(`Place '${place.name}' is isolated (no connections)`);
      } else if (outDeg > inDeg) {
        startCandidates++;
      } else if (inDeg > outDeg) {
        endCandidates++;
      } else {
        balancedPlaces++;
      }

      // Check for excessive branching
      if (outDeg > 1) {
        warnings.push(`Place '${place.name}' has ${outDeg} outgoing connections - multiple route options`);
      }
      if (inDeg > 1) {
        warnings.push(`Place '${place.name}' has ${inDeg} incoming connections - potential merge point`);
      }
    });

    // For a valid linear path, we should have exactly 1 start and 1 end
    if (startCandidates === 0) {
      errors.push('No starting place found (all places have incoming connections)');
    } else if (startCandidates > 1) {
      errors.push(`Multiple possible starting places found (${startCandidates}). Route may have branches.`);
    }

    if (endCandidates === 0) {
      errors.push('No ending place found (all places have outgoing connections)');
    } else if (endCandidates > 1) {
      errors.push(`Multiple possible ending places found (${endCandidates}). Route may have branches.`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Find the start and end places of the route
   */
  private findStartAndEndPlaces(graph: RouteGraph): { 
    isValid: boolean; 
    startPlace?: Place; 
    endPlace?: Place; 
    errors: string[] 
  } {
    const errors: string[] = [];
    let startPlace: Place | undefined;
    let endPlace: Place | undefined;

    graph.nodes.forEach((place, placeId) => {
      const inDeg = graph.inDegree.get(placeId) || 0;
      const outDeg = graph.outDegree.get(placeId) || 0;

      if (outDeg > inDeg && !startPlace) {
        startPlace = place;
      } else if (outDeg > inDeg && startPlace) {
        errors.push('Multiple starting places detected');
      }

      if (inDeg > outDeg && !endPlace) {
        endPlace = place;
      } else if (inDeg > outDeg && endPlace) {
        errors.push('Multiple ending places detected');
      }
    });

    if (!startPlace) {
      errors.push('Could not determine starting place');
    }
    if (!endPlace) {
      errors.push('Could not determine ending place');
    }

    return { 
      isValid: errors.length === 0, 
      startPlace, 
      endPlace, 
      errors 
    };
  }

  /**
   * Traverse the graph to sort tickets in order
   */
  private traverseGraphToSort(graph: RouteGraph, startPlace: Place): {
    isValid: boolean;
    sortedTickets: Ticket[];
    errors: string[];
  } {
    const errors: string[] = [];
    const sortedTickets: Ticket[] = [];
    const visitedPlaces = new Set<string>();
    
    let currentPlaceId: string | undefined = startPlace.id;
    if (!currentPlaceId) {
      errors.push('Start place has no valid ID');
      return { isValid: false, sortedTickets: [], errors };
    }

    visitedPlaces.add(currentPlaceId);

    while (currentPlaceId) {
      const outgoingTickets = graph.edges.get(currentPlaceId) || [];
      
      if (outgoingTickets.length === 0) {
        // End of route
        break;
      }

      if (outgoingTickets.length > 1) {
        errors.push(`Multiple route options from '${graph.nodes.get(currentPlaceId)?.name}' - cannot determine single path`);
        break;
      }

      const nextTicket = outgoingTickets[0];
      sortedTickets.push(nextTicket);
      
      currentPlaceId = nextTicket.to.id;
      if (!currentPlaceId) {
        errors.push('Ticket destination has no valid ID');
        break;
      }
      
      if (visitedPlaces.has(currentPlaceId)) {
        errors.push(`Circular route detected at '${nextTicket.to.name}'`);
        break;
      }
      
      visitedPlaces.add(currentPlaceId);
    }

    // Verify we used all tickets
    if (sortedTickets.length !== Array.from(graph.edges.values()).flat().length) {
      errors.push(`Could not create complete path - used ${sortedTickets.length} of ${Array.from(graph.edges.values()).flat().length} tickets`);
    }

    return {
      isValid: errors.length === 0,
      sortedTickets,
      errors,
    };
  }

  /**
   * Final validation of the sorted sequence
   */
  private validateSortedSequence(tickets: Ticket[]): { 
    isValid: boolean; 
    errors: string[]; 
    warnings: string[] 
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (tickets.length === 0) {
      errors.push('No tickets in sorted sequence');
      return { isValid: false, errors, warnings };
    }

    // Verify connections between consecutive tickets
    for (let i = 0; i < tickets.length - 1; i++) {
      const currentTicket = tickets[i];
      const nextTicket = tickets[i + 1];

      if (currentTicket.to.id !== nextTicket.from.id) {
        errors.push(
          `Gap in route between ticket ${i + 1} and ${i + 2}: ` +
          `'${currentTicket.to.name}' does not connect to '${nextTicket.from.name}'`
        );
      }

      // Check for potential timing issues (warning only)
      if (currentTicket.type === nextTicket.type && 
          currentTicket.to.name === nextTicket.from.name) {
        warnings.push(`Potential tight connection at '${currentTicket.to.name}' between two ${currentTicket.type} tickets`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
} 