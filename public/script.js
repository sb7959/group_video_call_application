let myVidStream;
const myVid = document.createElement("video");
myVid.muted = true;

const socket = io("/");
const videoGrid = document.getElementById("video-grid");
let enabled;
var peer = new Peer(undefined, {
  host: "localhost",
  port: "3030",
  path: "/peerjs",
});

const muteButton = document.querySelector(".main-mute-button");
const videoButton = document.querySelector(".main-video-button");
const peers = {};

//var getUserMedia = navigator.getUserMedia;
/* The MediaDevices.getUserMedia() method prompts the user for permission to use a media input which produces a MediaStream with tracks containing the requested types of media.*/

///getUserMedia
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVidStream = stream;
    console.log("getting tracks", myVidStream.getTracks());
    addvideoStream(myVid, stream);
    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

const inputEl = document.getElementById("chat-message");
let text;
inputEl.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    text = inputEl.value;
    console.log(text);
    socket.emit("message", text);
    inputEl.value = "";
  }
});

peer.on("call", (call) => {
  //getUserMedia
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addvideoStream(video, userVideoStream);
      });
    })
    .catch((e) => {
      console.log("error", e);
    });
});

let userID;
peer.on("open", (id) => {
  userID = id;
  socket.emit("join-room", ROOM_ID, id);
});

socket.on("createMessage", (message, userId) => {
  console.log("message coming from server is:", message);
  const ulEle = document.querySelector(".messages");
  const li = document.createElement("li");
  li.innerHTML = `user: ${message}`;
  console.log(userID, userId);
  if (userID === userId) {
    console.log("sender is sending message- try right align");
    li.style.textAlign = "right";
  } else {
    console.log("message is being recieved- try left align");
    li.style.textAlign = "left";
  }

  ulEle.appendChild(li);
  scrollToBottom();
});

const connectToNewUser = (userId, stream) => {
  console.log("inside connect to new user");
  let call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    console.log("displaying remote stream");
    addvideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
};

const addvideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
};

const scrollToBottom = () => {
  let chatEle = document.querySelector(".main-chat-window");
  chatEle.scrollTop = chatEle.scrollHeight;
};

const setMuteButton = () => {
  const html = `
      <i class="fas fa-microphone"></i>
      <span>Mute</span>
    `;
  document.querySelector(".main-mute-button").innerHTML = html;
};

muteButton.addEventListener("click", () => {
  enabled = myVidStream.getAudioTracks()[0].enabled;
  //console.log(myVidStream.getAudioTracks()[0]);
  if (enabled) {
    myVidStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVidStream.getAudioTracks()[0].enabled = true;
  }
});

videoButton.addEventListener("click", () => {
  let enabledT = myVidStream.getVideoTracks()[0].enabled;
  // console.log(myVidStream.getVideoTracks());
  if (enabledT) {
    console.log(userID);
    console.log(myVidStream.getVideoTracks()[0].id);
    // myVidStream
    //   .getVideoTracks()
    //   .forEach((track) =>
    //     track.id === userID ? !track.enabled : track.enabled
    //   );
    myVidStream.getVideoTracks()[0].enabled =
      !myVidStream.getVideoTracks()[0].enabled;

    setPlayVideo();
  } else {
    setStopVideo();
    myVidStream.getVideoTracks()[0].enabled =
      !myVidStream.getVideoTracks()[0].enabled;
  }
});

const setUnmuteButton = () => {
  const html = `
      <i class="unmute fas fa-microphone-slash"></i>
      <span>Unmute</span>
    `;
  document.querySelector(".main-mute-button").innerHTML = html;
};

const setStopVideo = () => {
  const html = `
      <i class="fas fa-video"></i>
      <span>Stop Video</span>
    `;
  document.querySelector(".main-video-button").innerHTML = html;
};

const setPlayVideo = () => {
  const html = `
    <i class="stop fas fa-video-slash"></i>
      <span>Play Video</span>
    `;
  document.querySelector(".main-video-button").innerHTML = html;
};

//audio not working in chrome--bug in chrome itself
//https://bugs.chromium.org/p/chromium/issues/detail?id=933677   --bug link
