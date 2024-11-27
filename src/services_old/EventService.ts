import { EventRepository } from '../repositories/EventRepository';
import { Event, EventCreationDTO, EventFilters } from '../types';

export class EventService {
    private eventRepository: EventRepository;

    constructor() {
        this.eventRepository = new EventRepository();
    }

    async addNewEvent(eventData: EventCreationDTO, creatorId: number): Promise<number> {
        return this.eventRepository.create(eventData, creatorId);
    }

    async getEvents(filters: EventFilters): Promise<Event[]> {
        return this.eventRepository.findByFilters(filters);
    }

    async deleteEvent(eventId: number, userId: number): Promise<void> {
        console.log('Attempting to delete event:', eventId);
        console.log('User attempting to delete:', userId);
        
        const event = await this.eventRepository.findById(eventId);
        
        if (!event) {
            console.log('Event not found');
            throw new Error('Event not found');
        }
        
        console.log('Event found:', {
            id: event.id,
            creatorId: event.creatorId,
            status: event.status
        });
        
        if (event.creatorId !== userId) {
            console.log('Creator ID mismatch:', {
                eventCreatorId: event.creatorId,
                attemptingUserId: userId
            });
            throw new Error('Only the event creator can delete this event');
        }
        
        await this.eventRepository.updateStatus(eventId, 'DELETED');
    }

    async evaluateNewEvent(eventId: number, approved: boolean): Promise<void> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) {
            throw new Error('Event not found');
        }
        if (event.status !== 'PENDING') {
            throw new Error('Only pending events can be evaluated');
        }
        const newStatus = approved ? 'APPROVED' : 'REJECTED';
        await this.eventRepository.updateStatus(eventId, newStatus);
    }

    async searchEvents(keyword: string): Promise<Event[]> {
        if (!keyword) {
            throw new Error('Search keyword is required');
        }
        return this.eventRepository.searchByKeyword(keyword);
    }
} 