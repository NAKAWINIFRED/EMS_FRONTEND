// import React, { useEffect, useRef, useState } from "react";
// import styles from "./ProctoringPage.module.css";

// export default function ProctoringPage() {
//   const videoRef = useRef(null);
//   const [permissionsGranted, setPermissionsGranted] = useState(false);

//   useEffect(() => {
//     const requestPermissions = async () => {
//       try {
//         if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//           throw new Error("Media Devices API not supported in this browser.");
//         }
  
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//         }
//         setPermissionsGranted(true);
  
//         if (document.documentElement.requestFullscreen) {
//           document.documentElement.requestFullscreen();
//         }
//       } catch (error) {
//         console.error("Permissions check failed:", error.message || error);
//         setPermissionsGranted(false);
//       }
//     };
  
//     requestPermissions();
//   }, []);
  

//   return (
//     <div className={styles.container}>
//       <h1 className={styles.title}>Exam Proctoring In Progress</h1>

//       {!permissionsGranted ? (
//         <div className={styles.alert}>
//           <p>Please allow access to your camera and microphone to proceed with the exam.</p>
//         </div>
//       ) : (
//         <div className={styles.videoContainer}>
//           <video ref={videoRef} autoPlay muted className={styles.video}></video>
//           <p className={styles.note}>You are being monitored for exam integrity.</p>
//         </div>
//       )}
//     </div>
//   );
// }
// ProctoringPage.jsx
// import React, { useEffect, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { TbDeviceComputerCamera } from "react-icons/tb";
// import { IoExitOutline } from "react-icons/io5";
// import styles from "./ProctoringPage.module.css"; // New CSS style (more advanced like you showed)
// import { ExamDetails } from "../../components/student/ExamDetails"; // Adjust path if necessary

// export default function ProctoringPage() {
//   const navigate = useNavigate();
//   const videoRef = useRef(null);
//   const audioStreamRef = useRef(null);

//   const [videoEnabled, setVideoEnabled] = useState(false);
//   const [audioEnabled, setAudioEnabled] = useState(false);
//   const [secureBrowser, setSecureBrowser] = useState(false);
//   const [consentGiven, setConsentGiven] = useState(false);
//   const [beginExamEnabled, setBeginExamEnabled] = useState(false);

//   const examId = "exam-id-from-context-or-api"; // Replace with dynamic examId when available

//   const handleWebcamToggle = async () => {
//     if (!videoEnabled) {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//         videoRef.current.srcObject = stream;
//         setVideoEnabled(true);
//       } catch (error) {
//         alert("Please allow webcam access to continue.");
//       }
//     } else {
//       stopWebcam();
//       setVideoEnabled(false);
//       alert("Webcam turned off. Redirecting...");
//       navigate("/student");
//     }
//   };

//   const stopWebcam = () => {
//     if (videoRef.current.srcObject) {
//       videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
//     }
//   };

//   const handleMicrophoneToggle = async () => {
//     if (!audioEnabled) {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//         audioStreamRef.current = stream;
//         setAudioEnabled(true);
//       } catch (error) {
//         alert("Please allow microphone access to continue.");
//       }
//     } else {
//       stopMicrophone();
//       setAudioEnabled(false);
//       alert("Microphone turned off. Redirecting...");
//       navigate("/student");
//     }
//   };

//   const stopMicrophone = () => {
//     if (audioStreamRef.current) {
//       audioStreamRef.current.getTracks().forEach((track) => track.stop());
//     }
//   };

//   const handleSecureBrowserToggle = () => {
//     setSecureBrowser(!secureBrowser);
//   };

//   const handleConsentChange = () => {
//     setConsentGiven(!consentGiven);
//   };

//   useEffect(() => {
//     if (videoEnabled && audioEnabled && secureBrowser && consentGiven) {
//       setBeginExamEnabled(true);
//     } else {
//       setBeginExamEnabled(false);
//     }
//   }, [videoEnabled, audioEnabled, secureBrowser, consentGiven]);

//   const handleBeginExam = () => {
//     if (beginExamEnabled) {
//       navigate(`/quiz/${examId}`);
//     } else {
//       alert("Complete all verification steps first.");
//     }
//   };

//   return (
//     <div className={styles["proctoring-overall"]}>
//       <div className={styles["examination-details"]}>
//         <ExamDetails />
//       </div>

//       <div className={styles["proctoring"]}>
//         <h1>PROCTORING VERIFICATION</h1>

//         <div
//           className={styles["video-container"]}
//           style={{ backgroundColor: videoEnabled ? "#ffffff" : "#ebebeb" }}
//         >
//           {!videoEnabled && <TbDeviceComputerCamera className={styles["video-icon"]} />}
//           <video ref={videoRef} autoPlay style={{ display: videoEnabled ? "block" : "none" }} />
//         </div>

//         <div className={styles["verification-boxes"]}>
//           <div className={styles["verification-box"]}>
//             <input
//               type="checkbox"
//               id="video"
//               checked={videoEnabled}
//               onChange={handleWebcamToggle}
//             />
//             <label htmlFor="video">Allow webcam access</label>
//           </div>

//           <div className={styles["verification-box"]}>
//             <input
//               type="checkbox"
//               id="audio"
//               checked={audioEnabled}
//               onChange={handleMicrophoneToggle}
//             />
//             <label htmlFor="audio">Allow audio recording</label>
//           </div>

//           <div className={styles["verification-box"]}>
//             <input
//               type="checkbox"
//               id="secure-browser"
//               checked={secureBrowser}
//               onChange={handleSecureBrowserToggle}
//             />
//             <label htmlFor="secure-browser">Engage Safe Browser</label>
//           </div>
//         </div>

//         <div className={styles["consent-section"]}>
//           <input
//             type="checkbox"
//             id="consent"
//             checked={consentGiven}
//             onChange={handleConsentChange}
//           />
//           <label htmlFor="consent">
//             I consent to video and audio capture for proctoring purposes.
//           </label>
//         </div>

//         <div className={styles["button-wrapper"]}>
//           <button
//             className={styles["begin-exam-btn"]}
//             onClick={handleBeginExam}
//             disabled={!beginExamEnabled}
//             style={{
//               backgroundColor: beginExamEnabled ? "green" : "#ebebeb",
//             }}
//           >
//             BEGIN EXAM
//           </button>

//           <button
//             className={styles["exit-btn"]}
//             onClick={() => navigate("/student")}
//           >
//             <IoExitOutline />
//             Exit
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
// import React, { useEffect, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { TbDeviceComputerCamera } from "react-icons/tb";
// import { IoExitOutline } from "react-icons/io5";
// import styles from "./ProctoringPage.module.css";

// export default function ProctoringPage() {
//   const navigate = useNavigate();
//   const videoRef = useRef(null);
//   const audioStream = useRef(null);

//   const [videoEnabled, setVideoEnabled] = useState(false);
//   const [audioEnabled, setAudioEnabled] = useState(false);
//   const [secureBrowser, setSecureBrowser] = useState(false);
//   const [consentGiven, setConsentGiven] = useState(false);
//   const [beginExamEnabled, setBeginExamEnabled] = useState(false);

//   const examId = "exam-id-placeholder"; // Replace dynamically later

//   const handleWebcamToggle = async () => {
//     if (!videoEnabled) {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//         videoRef.current.srcObject = stream;
//         setVideoEnabled(true);
//       } catch (error) {
//         alert("Please allow webcam access to continue.");
//       }
//     } else {
//       stopWebcam();
//       setVideoEnabled(false);
//       alert("Webcam turned off. Redirecting...");
//       navigate("/student");
//     }
//   };

//   const stopWebcam = () => {
//     if (videoRef.current.srcObject) {
//       videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
//     }
//   };

//   const handleMicrophoneToggle = async () => {
//     if (!audioEnabled) {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//           audio: true,
//         });
//         setAudioEnabled(true);
//         audioStream.current = stream;
//       } catch (error) {
//         alert("Please allow microphone access to continue.");
//       }
//     } else {
//       stopMicrophone();
//       setAudioEnabled(false);
//       alert("Microphone turned off. Redirecting...");
//       navigate("/student");
//       window.location.href = "/student";
//     }
//   };

//   const stopMicrophone = () => {
//     if (audioStream.current) {
//       audioStream.current.getTracks().forEach((track) => track.stop());
//     }
//   };

//   useEffect(() => {
//     if (videoEnabled && audioEnabled) {
//       setBeginExamEnabled(true);
//     } else {
//       setBeginExamEnabled(false);
//     }
//   }, [videoEnabled, audioEnabled]);

//   const handleBeginExam = () => {
//     console.log("Exam ID:", examId);  // Check if the examId is valid
//     if (beginExamEnabled) {
//       navigate(`/quiz/${examId}`);
//     } else {
//       alert("Please ensure all conditions are met before starting the exam.");
//     }
//   };


//   return (
//     <div className={styles["proctoring-overall"]}>
//       <div className={styles["proctoring"]}>
//         <h1>PROCTORING WINDOW</h1>

//         <div
//           className={styles["video-container"]}
//           style={{ backgroundColor: videoEnabled ? "#ffffff" : "#ebebeb" }}
//         >
//           {!videoEnabled && <TbDeviceComputerCamera className={styles["video-icon"]} />}
//           <video ref={videoRef} autoPlay style={{ display: videoEnabled ? "block" : "none" }} />
//         </div>

//         <div className={styles["verification-boxes"]}>
//           <div className={styles["verification-box"]}>
//             <input
//               type="checkbox"
//               id="video"
//               checked={videoEnabled}
//               onChange={handleWebcamToggle}
//             />
//             <label htmlFor="video">Allow webcam access</label>
//           </div>

//           <div className={styles["verification-box"]}>
//             <input
//               type="checkbox"
//               id="audio"
//               checked={audioEnabled}
//               onChange={handleMicrophoneToggle}
//             />
//             <label htmlFor="audio">Allow microphone access</label>
//           </div>

//           {/* <div className={styles["verification-box"]}>
//             <input
//               type="checkbox"
//               id="secure-browser"
//               checked={secureBrowser}
//               onChange={() => setSecureBrowser(!secureBrowser)}
//             />
//             <label htmlFor="secure-browser">Enable secure browser</label>
//           </div> */}
//         </div>

//         {/* <div className={styles["consent-section"]}>
//           <input
//             type="checkbox"
//             id="consent"
//             checked={consentGiven}
//             onChange={() => setConsentGiven(!consentGiven)}
//           />
//           <label htmlFor="consent">
//             I consent to audio and video recording during this exam.
//           </label>
//         </div> */}

// <div className={styles["button-wrapper"]}>
//   <button
//     className={styles["begin-exam-btn"]}
//     onClick={handleBeginExam}
//     disabled={!beginExamEnabled}
//     style={{
//       marginTop: "20px",
//       backgroundColor: beginExamEnabled ? "green" : "#ebebeb",
//       color: beginExamEnabled ? "white" : "#333",
//       border: beginExamEnabled ? "none" : "1px solid #ccc",
//       cursor: beginExamEnabled ? "pointer" : "not-allowed",
//     }}
//   >
//     BEGIN EXAM
//   </button>

//   <button
//     className={styles["exit-btn"]}
//     onClick={() => (window.location.href = "/student")}
//   >
//     <IoExitOutline />
//     Exit
//   </button>
// </div>

//       </div>
//     </div>
//   );
// }
// import React, { useEffect, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { TbDeviceComputerCamera } from "react-icons/tb";
// import { IoExitOutline } from "react-icons/io5";
// import styles from "./ProctoringPage.module.css";

// export default function ProctoringPage() {
//   const navigate = useNavigate();
//   const videoRef = useRef(null);
//   const audioStream = useRef(null);

//   const [videoEnabled, setVideoEnabled] = useState(false);
//   const [audioEnabled, setAudioEnabled] = useState(false);
//   const [beginExamEnabled, setBeginExamEnabled] = useState(false);

//   const examId = "exam-id-placeholder"; // Replace dynamically later

//   const handleWebcamToggle = async () => {
//     if (!videoEnabled) {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//         videoRef.current.srcObject = stream;
//         setVideoEnabled(true);
//       } catch (error) {
//         alert("Please allow webcam access to continue.");
//       }
//     } else {
//       stopWebcam();
//       setVideoEnabled(false);
//       alert("Webcam turned off. Redirecting...");
//       navigate("/student");
//     }
//   };

//   const stopWebcam = () => {
//     if (videoRef.current.srcObject) {
//       videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
//     }
//   };

//   const handleMicrophoneToggle = async () => {
//     if (!audioEnabled) {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//         audioStream.current = stream;
//         setAudioEnabled(true);
//       } catch (error) {
//         alert("Please allow microphone access to continue.");
//       }
//     } else {
//       stopMicrophone();
//       setAudioEnabled(false);
//       alert("Microphone turned off. Redirecting...");
//       navigate("/student");
//     }
//   };

//   const stopMicrophone = () => {
//     if (audioStream.current) {
//       audioStream.current.getTracks().forEach((track) => track.stop());
//     }
//   };

//   useEffect(() => {
//     if (videoEnabled && audioEnabled) {
//       setBeginExamEnabled(true);
//     } else {
//       setBeginExamEnabled(false);
//     }
//   }, [videoEnabled, audioEnabled]);

//   // Prevent tab switch / visibility change
//   useEffect(() => {
//     const handleVisibilityChange = () => {
//       if (document.visibilityState === "hidden") {
//         alert("You cannot switch tabs during the exam.");
//         navigate("/student");
//       }
//     };

//     document.addEventListener("visibilitychange", handleVisibilityChange);
//     return () => {
//       document.removeEventListener("visibilitychange", handleVisibilityChange);
//     };
//   }, [navigate]);

//   // Force fullscreen when permissions are granted
//   useEffect(() => {
//     if (videoEnabled && audioEnabled) {
//       const elem = document.documentElement;
//       if (elem.requestFullscreen) {
//         elem.requestFullscreen();
//       }
//     }
//   }, [videoEnabled, audioEnabled]);

//   // Monitor webcam activity
//   useEffect(() => {
//     const interval = setInterval(() => {
//       if (videoRef.current && videoRef.current.srcObject) {
//         const tracks = videoRef.current.srcObject.getVideoTracks();
//         if (tracks.length === 0 || tracks[0].readyState !== "live") {
//           alert("Webcam has been disabled. Redirecting...");
//           navigate("/student");
//         }
//       }
//     }, 3000);

//     return () => clearInterval(interval);
//   }, [videoEnabled, navigate]);

//   // Block shortcuts & right-click
//   useEffect(() => {
//     const blockKeys = (e) => {
//       if (
//         e.ctrlKey ||
//         e.metaKey ||
//         e.altKey ||
//         ["Tab", "F11", "F12"].includes(e.key)
//       ) {
//         e.preventDefault();
//         alert("Keyboard shortcuts are disabled during the exam.");
//       }
//     };

//     const disableContextMenu = (e) => e.preventDefault();

//     window.addEventListener("keydown", blockKeys);
//     window.addEventListener("contextmenu", disableContextMenu);

//     return () => {
//       window.removeEventListener("keydown", blockKeys);
//       window.removeEventListener("contextmenu", disableContextMenu);
//     };
//   }, []);

//   const handleBeginExam = () => {
//     if (beginExamEnabled) {
//       navigate(`/quiz/${examId}`);
//     } else {
//       alert("Please ensure all conditions are met before starting the exam.");
//     }
//   };

//   return (
//     <div className={styles["proctoring-overall"]}>
//       <div className={styles["proctoring"]}>
//         <h1>PROCTORING WINDOW</h1>

//         <div
//           className={styles["video-container"]}
//           style={{ backgroundColor: videoEnabled ? "#ffffff" : "#ebebeb" }}
//         >
//           {!videoEnabled && <TbDeviceComputerCamera className={styles["video-icon"]} />}
//           <video ref={videoRef} autoPlay style={{ display: videoEnabled ? "block" : "none" }} />
//         </div>

//         <div className={styles["verification-boxes"]}>
//           <div className={styles["verification-box"]}>
//             <input
//               type="checkbox"
//               id="video"
//               checked={videoEnabled}
//               onChange={handleWebcamToggle}
//             />
//             <label htmlFor="video">Allow webcam access</label>
//           </div>

//           <div className={styles["verification-box"]}>
//             <input
//               type="checkbox"
//               id="audio"
//               checked={audioEnabled}
//               onChange={handleMicrophoneToggle}
//             />
//             <label htmlFor="audio">Allow microphone access</label>
//           </div>
//         </div>

//         <div className={styles["button-wrapper"]}>
//           <button
//             className={styles["begin-exam-btn"]}
//             // onClick={handleBeginExam}
//             disabled={!beginExamEnabled}
//             style={{
//               marginTop: "20px",
//               backgroundColor: beginExamEnabled ? "green" : "#ebebeb",
//               color: beginExamEnabled ? "white" : "#333",
//               border: beginExamEnabled ? "none" : "1px solid #ccc",
//               cursor: beginExamEnabled ? "pointer" : "not-allowed",
//             }}
//           >
//             BEGIN EXAM
//           </button>

//           <button
//             className={styles["exit-btn"]}
//             // onClick={() => (window.location.href = "/student")}
//           >
//             <IoExitOutline />
//             Exit
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TbDeviceComputerCamera } from "react-icons/tb";
import { IoExitOutline } from "react-icons/io5";
import * as faceapi from "face-api.js";
import styles from "./ProctoringPage.module.css";

export default function ProctoringPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const audioStream = useRef(null);

  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [beginExamEnabled, setBeginExamEnabled] = useState(false);
  const [flagCount, setFlagCount] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);

  const examId = "exam-id-placeholder"; // Replace dynamically later

  const handleWebcamToggle = async () => {
    if (!videoEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        setVideoEnabled(true);
      } catch (error) {
        alert("Please allow webcam access to continue.");
      }
    } else {
      stopWebcam();
      setVideoEnabled(false);
      alert("Webcam turned off. Redirecting...");
      // navigate("/student");
    }
  };

  const stopWebcam = () => {
    if (videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  const handleMicrophoneToggle = async () => {
    if (!audioEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.current = stream;
        setAudioEnabled(true);
      } catch (error) {
        alert("Please allow microphone access to continue.");
      }
    } else {
      stopMicrophone();
      setAudioEnabled(false);
      alert("Microphone turned off. Redirecting...");
      // navigate("/student");
    }
  };

  const stopMicrophone = () => {
    if (audioStream.current) {
      audioStream.current.getTracks().forEach((track) => track.stop());
    }
  };

  useEffect(() => {
    if (videoEnabled && audioEnabled) {
      setBeginExamEnabled(true);
    } else {
      setBeginExamEnabled(false);
    }
  }, [videoEnabled, audioEnabled]);

  useEffect(() => {
    const disableContextMenu = (e) => e.preventDefault();
    const blockKeys = (e) => {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        ["Tab", "F11", "F12", "r", "R", "t", "T"].includes(e.key)
      ) {
        e.preventDefault();
        alert("Keyboard shortcuts are disabled during the exam.");
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flagStudent();
      }
    };
    const handleBlur = () => {
      flagStudent();
    };

    document.addEventListener("contextmenu", disableContextMenu);
    document.addEventListener("keydown", blockKeys);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("contextmenu", disableContextMenu);
      document.removeEventListener("keydown", blockKeys);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [navigate]);

  // useEffect(() => {
  //   const enablePointerLock = () => {
  //     document.body.requestPointerLock?.();
  //   };
  //   document.addEventListener("click", enablePointerLock);
  //   return () => {
  //     document.removeEventListener("click", enablePointerLock);
  //   };
  // }, []);

  const flagStudent = () => {
    setFlagCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= 3) {
        autoSubmitExam();
      }
      sendFlagToServer();
      return newCount;
    });
  };

  const autoSubmitExam = () => {
    alert("You have been flagged 3 times. Submitting exam.");
    // navigate("/student");
  };

  const sendFlagToServer = async () => {
    await fetch("/api/flags", { method: "POST" });
  };

  useEffect(() => {
    if (videoEnabled && audioEnabled) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      }
    }
  }, [videoEnabled, audioEnabled]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getVideoTracks();
        if (tracks.length === 0 || tracks[0].readyState !== "live") {
          alert("Webcam has been disabled. Redirecting...");
          // navigate("/student");
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [videoEnabled, navigate]);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      setModelLoaded(true);
    };
    loadModels();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (videoEnabled && modelLoaded && videoRef.current) {
        const result = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        );
        if (!result) {
          flagStudent();
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [videoEnabled, modelLoaded]);

  const handleBeginExam = () => {
    if (beginExamEnabled) {
      navigate('/exam-interface');
    } else {
      alert("Please ensure all conditions are met before starting the exam.");
    }
  };

  return (
    <div className={styles["proctoring-overall"]}>
      <div className={styles["proctoring"]}>
        <h1>PROCTORING WINDOW</h1>

        <div
          className={styles["video-container"]}
          style={{ backgroundColor: videoEnabled ? "#ffffff" : "#ebebeb" }}
        >
          {!videoEnabled && <TbDeviceComputerCamera className={styles["video-icon"]} />}
          <video ref={videoRef} autoPlay style={{ display: videoEnabled ? "block" : "none" }} />
        </div>

        <p>Flags: {flagCount}</p>

        <div className={styles["verification-boxes"]}>
          <div className={styles["verification-box"]}>
            <input
              type="checkbox"
              id="video"
              checked={videoEnabled}
              onChange={handleWebcamToggle}
            />
            <label htmlFor="video">Allow webcam access</label>
          </div>

          <div className={styles["verification-box"]}>
            <input
              type="checkbox"
              id="audio"
              checked={audioEnabled}
              onChange={handleMicrophoneToggle}
            />
            <label htmlFor="audio">Allow microphone access</label>
          </div>
        </div>

        <div className={styles["button-wrapper"]}>
          <button
            className={styles["begin-exam-btn"]}
            onClick={handleBeginExam}
            disabled={!beginExamEnabled}
            style={{
              marginTop: "20px",
              backgroundColor: beginExamEnabled ? "green" : "#ebebeb",
              color: beginExamEnabled ? "white" : "#333",
              border: beginExamEnabled ? "none" : "1px solid #ccc",
              cursor: beginExamEnabled ? "pointer" : "not-allowed",
            }}
          >
            BEGIN EXAM
          </button>

          <button
            className={styles["exit-btn"]}
            // onClick={() => navigate("/student")}
          >
            <IoExitOutline />
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
