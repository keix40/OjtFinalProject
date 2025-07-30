import { Injectable } from '@angular/core';
import { EventDTO } from '../event-dto';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  baseUrl = 'http://localhost:8080/events';

  constructor(private http: HttpClient) {}

  createEvent(eventData: EventDTO, imageFile: File): Observable<any> {
    const formData = new FormData();
    formData.append("data", new Blob([JSON.stringify(eventData)], { type: "application/json" }));
    if (imageFile) formData.append("image", imageFile);
    return this.http.post(`${this.baseUrl}/create`, formData);
  }
  
  updateEvent(id: number, eventData: EventDTO, imageFile?: File): Observable<any> {
    const formData = new FormData();
    formData.append("data", new Blob([JSON.stringify(eventData)], { type: "application/json" }));
    if (imageFile) {
      formData.append("image", imageFile);
    }
    return this.http.put(`${this.baseUrl}/update/${id}`, formData, {responseType: 'text'});
  }

  getAllEvents(): Observable<EventDTO[]> {
    return this.http.get<EventDTO[]>(`${this.baseUrl}/list`);
  }

  getEventById(id: number): Observable<EventDTO> {
    return this.http.get<EventDTO>(`${this.baseUrl}/${id}`);
  }
  
  getNextSlideNo(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/next-slide-no`);
  }

  getActiveEventsForHero(): Observable<EventDTO[]> {
    return this.http.get<EventDTO[]>(`${this.baseUrl}/hero`);
  }

  deleteEvent(id: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/delete/${id}`, {});
  }

  updateEventOrder(order: {id: number, slideNo: number}[]) {
    return this.http.post<any>(`${this.baseUrl}/update-order`, order);
  }
}
