import React, {
  Component
} from "react";
import AgoraRTC from "agora-rtc-sdk";

const appId = "d641844b34b143138dedd81de7edc1ef"; //should move to env file


export default class AgoraVideo extends Component {
  constructor(props) {
    super(props);
    this.videoClient = {};
    this.screenClient = {}
    this.videoStream = {};
    this.screenStream = {};
    this.state = {
      streams: [],
      token: null,
      channelName: 'Test',
      uid: null,
      shareScreen: false,
      shareVideo: true,
      shareAudio: true
    };
  }

  componentDidMount = () => {
    let data = this.state

    this.videoClient = AgoraRTC.createClient({
      mode: "live",
      codec: "h264"
    });
    this.screenClient = AgoraRTC.createClient({
      mode: "rtc",
      codec: "vp8"
    });
    this.videoClient.init(appId, () => {
      console.log("AgoraRTC Video client initialized ");
      this.videoClient.on('stream-added', (evt) => {
        let stream = evt.stream;
        console.log("New stream added: " + stream.getId());
        this.addStream(stream)
        this.videoClient.subscribe(stream, (err) => {
          console.log("Subscribe stream failed", err);
        });
      });
      this.videoClient.on('stream-subscribed', (evt) => {
        let remoteStream = evt.stream;
        console.log("Subscribe remote stream successfully: " + remoteStream.getId());
        // remoteStream.play('screen' + remoteStream.getId());
      })
      this.videoClient.join(data.token, data.channelName, data.uid, (uid) => {
        this.setState({
          uid: uid
        })

        this.videoStream = AgoraRTC.createStream({
            streamID: uid,
            audio: true,
            video: true,
            screen: false
          } //has additional optional properties, should move into state or props so we   can change this in future
        );

        this.videoStream.init(() => {
          console.log("getUserMedia successfully");
          // this.videoStream.play('screen');
          this.addStream(this.videoStream)

          this.videoClient.publish(this.videoStream, (err) => {
            console.log("Publish local stream error: " + err);
          });

          this.videoClient.on('stream-published', (evt) => {
            console.log("Publish local stream successfully");
          });

        }, (err) => {
          console.log("getUserMedia failed", err);
        });
      },
      (err) => {
        console.log("Join has failed", err);
      }
    );
    }, (err) => {
      console.log("AgoraRTC Video client init failed", err);
    });
  };

  componentDidUpdate = () => {
    this.state.streams.forEach((stream) => {
      stream.play('screen')
    })
  }

  shareVideo = (e) => {
    this.setState({
      shareVideo: !this.state.shareVideo
    })
    this.videoStream.isVideoOn() ? this.videoStream.disableVideo() : this.videoStream.enableVideo()
  }

  shareAudio = (e) => {
    this.setState({
      shareAudio: !this.state.shareAudio
    })
    this.videoStream.isAudioOn() ? this.videoStream.disableAudio() : this.videoStream.enableAudio()
  }

  shareScreen = (e) => {
    let data = this.state
    this.setState({
      shareScreen: !this.state.shareScreen
    })

    if (!this.state.shareScreen) {
      this.screenClient.init(appId, () => {
        console.log("AgoraRTC Screen client initialized ");
      }, (err) => {
        console.log("AgoraRTC Screen client init failed", err);
      });

      this.screenClient.join(data.token, 'ScreenShare', data.uid, (uid) => {
        this.screenStream = AgoraRTC.createStream({
          streamID: uid,
          audio: false,
          video: false,
          screen: true,
          extensionId: 'aiplemfbghcodolhnoapagmaidbiocfk',
          mediaSource: 'window'
        });
        this.screenStream.play('screen');
        this.screenClient.publish(this.screenStream)
        
      })
    }
  }
  
  addStream(newStream) {
    this.setState({ streams: [...this.state.streams, newStream]})
  }

  render() {
    return ( 
      <div>
        <div className = 'body' id = 'screen' style = {{height:"80vh", width:"80vh"}}>
          <h1 > Agora RTC Video Stream </h1> 
          <button onClick={(e)=>this.shareVideo(e)}> Video: {this.state.shareVideo ? 'On' : 'Off'} </button>
          <button onClick={(e)=>this.shareAudio(e)}> Microphone: {this.state.shareAudio ? 'On' : 'Off'} </button>
          <button onClick={(e)=>this.shareScreen(e)}> Share Screen: {this.state.shareScreen ? 'On' : 'Off'} </button>
          <div id='agora_remote' />
        </div>
      </div>
    )
  }
}