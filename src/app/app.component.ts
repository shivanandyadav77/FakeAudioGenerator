import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { AudioRecordingService } from './audio-recording.service';
import { DomSanitizer } from '@angular/platform-browser';
import RecordRTC from 'recordrtc';
import { CONFIG } from './app.config'
import { Subscription } from "rxjs";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class AppComponent implements OnDestroy {

  

  inputValue: string = 'Artificial Intelligence (AI) is an umbrella term for computer software that mimics human cognition in order to perform complex tasks and learn from them. Machine learning (ML) is a subfield of AI that uses algorithms trained on data to produce adaptable models that can perform a variety of complex tasks.';
 
  chkRandomseeds: boolean = false;
  txtRandomseed:number | null = null;
  chkEnhancevocoderoutput: boolean = false;

  selectedVocoder:string = 'default';
  VocoderValues:string[] = ['default','Griffin-Lim'];

  selectedEncoder:string = 'default';
  EncoderValues:string[] = ['default'];

  selectedSynthesizer:string = 'default';
  SynthesizerValues:string[] = ['default'];


  progressbar=false
  playFakeAudio:any
  base64string:any
  isPlaying = false;
  displayControls = true;
  isAudioRecording = false;
  audioRecordedTime;
  audioBlobUrl;
  audioBlobUrl_data;
  fakeaudioUrl
  audioBlob;
  audioName;
  audioStream;
  audioConf = { audio: true };
  blobData:any
  onAudioClonedSubscription: Subscription; 

  ActionEnableDisable=false


  constructor(
   
    private ref: ChangeDetectorRef,
    private audioRecordingService: AudioRecordingService,
    private sanitizer: DomSanitizer
  ) {

    this.playFakeAudio=true
    this.audioRecordingService.recordingFailed().subscribe(() => {
      this.isAudioRecording = false;
      this.ActionEnableDisable=true
      this.ref.detectChanges();
    });
  

    
    this.audioRecordingService.getRecordedTime().subscribe((time) => {
      this.audioRecordedTime = time;
      this.ref.detectChanges();
    });

    this.audioRecordingService.getRecordedBlob().subscribe((data) => {


    const blobData = new Blob([data.blob], { type:'audio/mp3'  });
    this.ConvertBlobToBase64(data.blob).then((base64data)=>{
    this.base64string=base64data.split(",")[1]

    // console.log("-----"+this.base64string)

    this.audioBlob = data.blob;
    this.audioName = data.title;
    this.audioBlobUrl = this.sanitizer.bypassSecurityTrustUrl(
      URL.createObjectURL(data.blob)
    );
    this.ref.detectChanges();
    // this.base64string=this.base64string.replace('data:audio/mp3;base64,','')
    // this.base64string=  this.base64string.replace(/(?:\\[rn])+/g,"")

    }).catch((error)=>{
    console.error(error);
    });


     
    });
  }


  ngOnInit() 
  {
    this.progressbar=false
  this.onAudioClonedSubscription = this.audioRecordingService.CloneAudioChanged.subscribe(
    (data:any) => {
      this.progressbar=false
      this.ActionEnableDisable=true
       this.audioBlobUrl_data=data
     this.fakeaudioUrl = URL.createObjectURL(data);     
    }); //end of getting image data.    
}

onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    if (file.type.startsWith('audio/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
         this.base64string = (reader.result as string).split(',')[1];
        this.audioBlob = reader.result;
        this.isAudioRecording = false;
        this.ActionEnableDisable=true
        this.playFakeAudio=false
        this.audioBlobUrl=this.audioBlob
        console.log( this.audioBlob)
        // this.audioBlobUrl = this.sanitizer.bypassSecurityTrustUrl(
        //   URL.createObjectURL(reader.result)
        // );
      };

      reader.readAsDataURL(file);  // Read the file as Data URL for the audio element
    } else {
      alert('Please select a valid audio file.');
    }
  }
 
}

  validateInput(event: KeyboardEvent) {
    const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Backspace', 'ArrowLeft', 'ArrowRight', 'Tab'];

    if (!allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  startAudioRecording() {
    if (!this.isAudioRecording) {
      this.isAudioRecording = true;
      this.ActionEnableDisable=false
      this.playFakeAudio=false
      this.audioRecordingService.startRecording();
    }
  }

  abortAudioRecording() {
    if (this.isAudioRecording) {
      this.isAudioRecording = false;
      this.ActionEnableDisable=false
      this.playFakeAudio=false
      this.audioRecordingService.abortRecording();
    }
  }

  stopAudioRecording() {
    if (this.isAudioRecording) {
      this.audioRecordingService.stopRecording();
      this.isAudioRecording = false;
      this.ActionEnableDisable=true
      this.playFakeAudio=false
    }
  }

  clearAudioRecordedData() {
    this.audioBlobUrl = null;
    this.ActionEnableDisable=false
    this.fakeaudioUrl=false
  }

  downloadAudioRecordedData() {
    this._downloadFile(this.audioBlob, 'audio/mp3', this.audioName);
  }

  ngOnDestroy(): void {
    this.abortAudioRecording();
  }

   _downloadFile(data: any, type: string, filename: string){
    const url = window.URL.createObjectURL(data);
    const anchor = document.createElement('a');
    anchor.download = filename;
    anchor.href = url;
    document.body.appendChild(anchor);
    anchor.click();
  }

  SynthesizeAndVocoder()
  {
    this.FormatInputValues(this.audioBlob, 'audio/x-m4a',"Yes","No","No");
  }
  SynthesizeOnly(){
    this.FormatInputValues(this.audioBlob, 'audio/mp3',"No","Yes","No");

  }
  VocoderOnly(){
    this.FormatInputValues(this.audioBlob, 'audio/mp3',"No","Yes","No");

  }

  async ConvertBlogTemp(blob:any){
    await this.ConvertBlobToBase64(blob);

  }

   FormatInputValues(data: any, type: string, synthesizeAndVocoder: string,synthesizeonly: string,vocodereonly: string){

   

    // const blob = new Blob([data], { type: type });

    // //  this.ConvertBlogTemp(blob);

    // this.ConvertBlobToBase64(blob).then((base64data)=>{
    //   this.base64string=base64data

    // this.base64string=this.base64string.replace('data:audio/mp3;base64,','')
    // this.base64string=this.base64string.replace('data:audio/x-m4a;base64,','')
    let txtSeedValue=""
    if (this.chkRandomseeds==true)
    {
      txtSeedValue=this.txtRandomseed.toString()

    }else{
      txtSeedValue=null
    }
   
    let postPayload={
      "audio":this.base64string,
      "txtValue": this.inputValue,
      "Randomseeds": txtSeedValue,     
      "Enhancevocoderoutput": this.chkEnhancevocoderoutput,
      "Vocoder":this.selectedVocoder,
      "Encoder":this.selectedEncoder,
      "Synthesizer":this.selectedSynthesizer,
      "SynthesizerAndVocoder":synthesizeAndVocoder,
      "Synthesizeronly":synthesizeonly,
      "Vocoderonly":vocodereonly
    }

    this.ActionEnableDisable=false
    this.progressbar=true

    this.audioRecordingService.GetClonedAudio(CONFIG,postPayload)



    // }).catch((error)=>{
    // console.error(error);
    // });

    
  

  }

  ConvertBlobToBase64(blob:Blob): Promise<string>
  {
  return new Promise((resolve,reject)=>{
    const reader=new FileReader;
    reader.onload=()=>resolve(reader.result as string);
      reader.onerror=(error)=>reject(error);
      reader.readAsDataURL(blob)
  });

  }

  playAudio() {   
    const audio = new Audio(this.fakeaudioUrl);
    audio.play();
  }
 
  downloadFakeAudioRecordedData(){

    const url = window.URL.createObjectURL(this.audioBlobUrl_data);
    const anchor = document.createElement('a');
    anchor.download = "TestAudioFile.mp3";
    anchor.href = url;
    document.body.appendChild(anchor);
    anchor.click();
  }
}
