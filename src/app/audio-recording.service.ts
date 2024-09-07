import { Injectable } from '@angular/core';

import RecordRTC from 'recordrtc';
import moment from 'moment';
import { Observable, Subject } from 'rxjs';

import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient,HttpHeaders ,HttpParams} from '@angular/common/http';

interface RecordedAudioOutput {
  blob: Blob;
  title: string;
}

@Injectable({
  providedIn: 'root'
})
export class AudioRecordingService {
  
  private stream;
  private recorder;
  private interval;
  private startTime;
  private _recorded = new Subject<RecordedAudioOutput>();
  private _recordingTime = new Subject<string>();
  private _recordingFailed = new Subject<string>();
  fakeaudioUrl:any
  
  CloneAudioChanged = new Subject<any>();


  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}
  setCloneAudioChanged(pData:any){
    this.CloneAudioChanged.next(pData);
  }

GetClonedAudio(CONFIG:any,postPayload:any) 
{ 
  let header = new HttpHeaders();
  header = header.append('Content-Type', 'application/json');
  header = header.append('Accept' , 'text/plain');
 header = header.append('Access-Control-Allow-Origin' , '*');
  header = header.append('Accept','Access-Control-Allow-Origin');
  header = header.append('Connection','Keep-Alive');
  header = header.append('Accept','Connection');
  header = header.append('Keep-Alive','timeout=15000, max=150000');
  header = header.append('Accept','Keep-Alive');

  
  this.http.post<any>(CONFIG.apiURL, postPayload,{headers:header,responseType:'blob' as 'json' })
  .subscribe(data => {
     this.setCloneAudioChanged(data)
  });

}


  getRecordedBlob(): Observable<RecordedAudioOutput> {
    return this._recorded.asObservable();
  }

  getRecordedTime(): Observable<string> {
    return this._recordingTime.asObservable();
  }

  recordingFailed(): Observable<string> {
    return this._recordingFailed.asObservable();
  }

  startRecording() {
    if (this.recorder) {
      // It means recording is already started or it is already recording something
      return;
    }

    this._recordingTime.next('00:00');
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((s) => {
        this.stream = s;
        this.record();
      })
      .catch((error) => {
        console.log(error)
        // this._recordingFailed.next();
      });
  }

  abortRecording() {
    this.stopMedia();
  }

  private record() {
    this.recorder = new RecordRTC.StereoAudioRecorder(this.stream, {
      type: 'audio',
      mimeType: 'audio/mp3',
    });

    this.recorder.record();
    this.startTime = moment();
    this.interval = setInterval(() => {
      const currentTime = moment();
      const diffTime = moment.duration(currentTime.diff(this.startTime));
      const time =
        this.toString(diffTime.minutes()) +
        ':' +
        this.toString(diffTime.seconds());
      this._recordingTime.next(time);
    }, 500);
  }

  private toString(value) {
    let val = value;
    if (!value) {
      val = '00';
    }
    if (value < 10) {
      val = '0' + value;
    }
    return val;
  }

  stopRecording() {
    if (this.recorder) {
      this.recorder.stop(
        (blob) => {
          if (this.startTime) {
            const mp3Name = encodeURIComponent(
              'audio_' + new Date().getTime() + '.mp3'
            );
            this.stopMedia();
            this._recorded.next({ blob: blob, title: mp3Name });
          }
        },
        () => {
          this.stopMedia();
          // this._recordingFailed.next();
        }
      );
    }
  }

  private stopMedia() {
    if (this.recorder) {
      this.recorder = null;
      clearInterval(this.interval);
      this.startTime = null;
      if (this.stream) {
        this.stream.getAudioTracks().forEach((track) => track.stop());
        this.stream = null;
      }
    }
  }
}
