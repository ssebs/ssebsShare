import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";

function App() {
    const [yourID, setYourID] = useState("");
    const [users, setUsers] = useState({});
    const [stream, setStream] = useState();
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState("");
    const [callerSignal, setCallerSignal] = useState();
    const [callAccepted, setCallAccepted] = useState(false);
    const [vidSrc, setVidSrc] = useState();

    const userVideo = useRef();
    const partnerVideo = useRef();
    const socket = useRef();

    useEffect(() => {
        // socket.current = io.connect("https://share.ssebs.com", {
        //     transports: ["polling"],
        // });
        socket.current = io.connect("https://share.ssebs.com");
        // When you get your id
        socket.current.on("yourID", (id) => {
            setYourID(id);
        });
        // When the userlist is updated
        socket.current.on("allUsers", (users) => {
            setUsers(users);
        });

        // Someone is calling you
        socket.current.on("hey", (data) => {
            setReceivingCall(true);
            setCaller(data.from);
            setCallerSignal(data.signal);
        });
    }, []);

    const callPeer = (id) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream,
        });

        // tell peer you wanna talk
        peer.on("signal", (data) => {
            socket.current.emit("callUser", {
                userToCall: id,
                signalData: data,
                from: yourID,
            });
        });

        // on recv stream
        peer.on("stream", (stream) => {
            partnerVideo.current.srcObject = stream;
        });

        socket.current.on("callAccepted", (signal) => {
            setCallAccepted(true);
            peer.signal(signal);
        });
    };

    const acceptCall = () => {
        setCallAccepted(true);
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream,
        });
        // on peer connect
        peer.on("signal", (data) => {
            socket.current.emit("acceptCall", { signal: data, to: caller });
        });

        // on recv stream
        peer.on("stream", (stream) => {
            partnerVideo.current.srcObject = stream;
        });

        // send to peer that you're ready
        peer.signal(callerSignal);
    };

    const chooseSource = (e) => {
        e.preventDefault();
        if (vidSrc === "cam") {
            navigator.mediaDevices
                .getUserMedia({ video: true, audio: false })
                .then((stream) => {
                    setStream(stream);
                    userVideo.current.srcObject = stream;
                })
                .catch(() => {
                    window.alert("Could not get camera");
                });
        } else if (vidSrc === "screen") {
            navigator.mediaDevices
                .getDisplayMedia({ video: true, audio: false })
                .then((stream) => {
                    setStream(stream);
                    userVideo.current.srcObject = stream;
                })
                .catch(() => {
                    window.alert("Could not get screen share");
                });
        }
    };

    return (
        <>
            <nav className="navbar navbar-dark bg-ssebs">
                <div className="container">
                    <span className="navbar-brand mb-0 h1 px-3">
                        ssebsShare
                    </span>
                </div>
            </nav>
            <div className="container">
                <h5 className="m-3">Choose a Video Source</h5>
                <form onSubmit={chooseSource} className="form-inline my-3">
                    <div className="form-group">
                        <select
                            name="source"
                            onChange={(e) => setVidSrc(e.target.value)}
                            value={vidSrc}
                            className="form-control mx-3"
                        >
                            <option disabled selected>
                                Source
                            </option>
                            <option value="cam">Camera</option>
                            <option value="screen">Screen Share</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-ssebs">
                        Select
                    </button>
                </form>
                <hr />
                {vidSrc && stream && (
                    <div className="mx-3">
                        <div className="d-flex">
                            <div className="half text-center">
                                <strong>Your Video:</strong>
                                <hr />
                                {stream ? (
                                    <video
                                        width="500"
                                        playsInline
                                        muted
                                        ref={userVideo}
                                        autoPlay
                                        className="border-black"
                                    />
                                ) : (
                                    <div>You haven't selected a source</div>
                                )}
                            </div>
                            <div className="half text-center">
                                <strong>Partner's Video:</strong>
                                <hr />
                                {callAccepted ? (
                                    <video
                                        width="500"
                                        playsInline
                                        ref={partnerVideo}
                                        autoPlay
                                        controls
                                        className="border-black"
                                    />
                                ) : (
                                    <div>Not in a call yet...</div>
                                )}
                            </div>
                        </div>
                        <hr />
                        <div>
                            <p>All people on the server:</p>
                            {Object.keys(users).map((key) => {
                                if (key === yourID) return null;
                                return (
                                    <button
                                        onClick={() => callPeer(key)}
                                        key={key}
                                        className="btn btn-outline-primary"
                                    >
                                        Call {key}
                                    </button>
                                );
                            })}
                        </div>
                        <>
                            {receivingCall && (
                                <div>
                                    <hr />
                                    <p
                                        className="alert alert-primary"
                                        role="alert"
                                    >
                                        {caller} is calling you
                                    </p>
                                    <button
                                        onClick={acceptCall}
                                        className="btn btn-ssebs"
                                    >
                                        Accept
                                    </button>
                                </div>
                            )}
                        </>
                    </div>
                )}
            </div>
        </>
    );
}

export default App;
