# Can You See Me?

"...What about now? Wait, hold on, is this any better?" All this sound pretty familiar, doesn't it? Every time we dial into video conference call, either for the 10th redundant meeting of the day or to catch up with Grandma, nothing works as you would expect. That is why I wanted to find a better video calling integration for my own applications. 

Many companies such as Twilio offer video calling APIs. But since I've worked with Twilio's API in previous events, I wanted to try something new and stumbled upon Agora as an alternative. Their [documentation](https://docs.agora.io/en/Video/web_prepare?platform=Web) promises high quality, low-latency video call service, and over 200 data centers distributed around the world to ensure resilience to packet loss. You'll never miss another word when talking to 1,000 colleagues and/or Grandmas. As a developer, I love it when APIs are easy to embed, but embedding it 100 times across 100 apps still isn't ideal. Thus, this guide will show you how I threw the Agora Video Web SDK into a reusable React component! 

To start off, I simply created a new React application called agora-react using the follow steps:

```
npx create-react-app agora-react
cd agora-react
```

After generating our generic React application, let's start off by expanding our folders to fit our use case. We want to create a reusable Agora video component with the web SDK so the following command help us structure our project accordingly:
```
mkdir ./src/components && touch ./src/components/AgoraVideo.js
npm install agora-rtc-sdk
```
Next, let's open our empty AgoraVideo file turn it into a generic class-based component. In a new component called AgoraVideo.js, we need to import the Agora npm package we installed earlier. We also have to grab the App Id you can generate at [Agora's developer dashboard](https://dashboard.agora.io/). Lastly, we're returning a JSX div with the ID of 'screen'. This ID is important because that will be how we tell Agora where on web UI to place a video interface. 

```javascript
// ./src/components/AgoraVideo.js

import React, { Component } from "react";
import AgoraRTC from "agora-rtc-sdk";
const appId = '*************************' //at https://dashboard.agora.io/

export default class AgoraVideo extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount = () => {
      
  }

  render() {
    return ( 
      <div className = 'body' id = 'screen' style = {{height:"100vh"}}>
        <h1 > Agora RTC Video Stream </h1> 
      </div>
    )
  }
}
```
Let's throw some Agora functionality into our componentWillMount method.  We need two objects when initializing a video stream with Agora: Client and Stream.
First, we need to use the AgoraRTC package to create our client object like this:
```javascript
this.client = AgoraRTC.createClient({mode: "live", codec: "h264"});
```
Note that the options we passed into AgoraRTC.createClient can be customized for different video settings. You can fine tune it to your preference or add a dropdown menu and let the user select what they want. For now, I just kept it to the default recommendation on the documentation. We then initialize the client we just created with the App ID generated on the developer dashboard:
```javascript
this.client.init(appId, () => {}, (err) => {console.log("AgoraRTC Video client init failed", err)});
```
After initializing the client, we want to join an AgoraRTC channel. To join the channel, we need a token(string), channelName(string), userId(number). To make this component reusable, we should pass these parameters into the component using props but I will just keep them in state for now. 
```javascript
...
    this.state = {
      token: null,          //can pass null if low security requirement 
      channelName: 'Test',  //unique channel name
      uid: null,            //unique id, will be assigned one if pass null
    };
...

    componentDidMount = () => {
        let data = this.state //can change to this.props when refactoring
        ...
        this.client.join(data.token, data.channelName, data.uid, (uid) => {
            this.setState({ uid: uid })
        }, (err) => { console.log("Join has failed", err)});
    }
```
The client.join method will return a new user ID for us since we passed null as the uid param to begin with. Eventually, if we wanted to give the users ability to login and pick what channel to join, we can set up a input form that updates the state of uid and channelName prior to the component mounting.

We're almost done! But before moving forward, here is how my component looks after everything above. If you have any questions, shoot me a message or check out [Agora's documentation page](https://docs.agora.io/en/Video/API%20Reference/web/index.html) that dives deeper.
```javascript
  constructor(props) {
    super(props);
    this.client = {};
    this.stream = {};
    this.state = {
      token: null,
      channelName: 'Test',
      uid: null,
    };
  }

  componentDidMount = () => {
    let data = this.state
    this.client = AgoraRTC.createClient({mode: "live", codec: "h264"});
    this.client.init(appId, () => {}, (err) => {console.log("AgoraRTC Video client init failed", err)});

    this.client.join(data.token, data.channelName, data.uid, (uid) => {
            this.setState({ uid: uid })
        }, (err) => { console.log("Join has failed", err)}
    );
  };
```
Okay, so now that we have an initialized client, and used it to join a channel, what's next? Remember when I mentioned that we need two objects? Well, this is when we have to create our Stream object. The stream object is in charge of creating the actual visual UI that turns on your webcam and displays it folks in the same channel. So within client.join's onSuccess callback, let's use the AgoraRTC package once more:
```javascript
  this.client.join(data.token, data.channelName, data.uid, (uid) => {
            ...
            this.stream = AgoraRTC.createStream({
                streamID: uid,
                audio: true,       
                video: true,
                screen: false
            });
        }, (err) => { console.log("Client join has failed: ", err)}
    );
```
Next, take the stream object and initialize it like we did with our client object. In the callback, we want to specify which html element Agora is going to place the video player in. As mentioned earlier, we created a JSX div with the id='screen' just for this purpose! So in the stream object, we call the play method and pass along the div id. Then we call the client one last time to publish the stream object.
```javascript
    this.videoStream.init(() => {
        this.videoStream.play('screen');
        this.videoClient.publish(this.videoStream, (err) => {
            console.log("Publish local stream error: " + err);
        });
    }, (err) => {
        console.log("getUserMedia failed", err);
    });
```
Lastly, we need to update the App.js file to properly display our new AgoraVideo component: 
```javascript
// ./src/App.js

import React, { Component } from 'react';
import AgoraVideo from './components/AgoraVideo'

class App extends Component {
  render() {
    return (
      <div>
        <AgoraVideo />
      </div>
    );
  }
}

export default App;

```
Now go to your terminal and run ```npm start```.

"Can you see me?"

"Yes Grandma, I can!"👋 

![Image of Me!](https://i.imgur.com/1V0vrML.jpg)

Part two will cover how to connect a stream initialized another server by utilizing the stream ID that. Stay tuned!