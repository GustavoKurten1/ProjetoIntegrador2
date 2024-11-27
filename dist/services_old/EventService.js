"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const EventRepository_1 = require("../repositories/EventRepository");
class EventService {
    constructor() {
        this.eventRepository = new EventRepository_1.EventRepository();
    }
    addNewEvent(eventData, creatorId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.eventRepository.create(eventData, creatorId);
        });
    }
    getEvents(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.eventRepository.findByFilters(filters);
        });
    }
    deleteEvent(eventId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Attempting to delete event:', eventId);
            console.log('User attempting to delete:', userId);
            const event = yield this.eventRepository.findById(eventId);
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
            yield this.eventRepository.updateStatus(eventId, 'DELETED');
        });
    }
    evaluateNewEvent(eventId, approved) {
        return __awaiter(this, void 0, void 0, function* () {
            const event = yield this.eventRepository.findById(eventId);
            if (!event) {
                throw new Error('Event not found');
            }
            if (event.status !== 'PENDING') {
                throw new Error('Only pending events can be evaluated');
            }
            const newStatus = approved ? 'APPROVED' : 'REJECTED';
            yield this.eventRepository.updateStatus(eventId, newStatus);
        });
    }
    searchEvents(keyword) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!keyword) {
                throw new Error('Search keyword is required');
            }
            return this.eventRepository.searchByKeyword(keyword);
        });
    }
}
exports.EventService = EventService;
