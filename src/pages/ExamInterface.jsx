import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ExamInterface.module.css';

const ExamInterface = () => {
  const [showInstructions, setShowInstructions] = useState(true);
  const [currentSection, setCurrentSection] = useState('instructions');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answers, setAnswers] = useState({});
  const [fullscreen, setFullscreen] = useState(false);
  const [timer, setTimer] = useState({
    hours: 3,
    minutes: 0,
    seconds: 0
  });
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const videoRef = useRef(null);
  const faceDetectionInterval = useRef(null);
  const navigate = useNavigate();

  // Exam data structure
  const examData = {
    instructions: {
      title: "Exam Instructions",
      content: [
        "This is a secure examination for Clarke International University.",
        "The exam consists of three sections: A, B, and C.",
        "You must complete all sections within the allocated time.",
        "Section A contains multiple choice questions.",
        "Section B contains short answer questions.",
        "Section C requires an essay response.",
        "The exam must be taken in full-screen mode with camera monitoring.",
        "You cannot copy, paste, take screenshots, or switch tabs during this exam.",
        "Leaving the exam window will be recorded and may result in disqualification.",
        "Click 'Start Exam' when you are ready to begin. This will activate your camera."
      ]
    },
    sections: {
      A: {
        title: "Section A",
        description: "Multiple Choice Questions",
        questions: [
          {
            id: "A1",
            text: "What is the capital city of Uganda?",
            options: ["Kampala", "Nairobi", "Kigali", "Dodoma"],
            type: "multiple-choice"
          },
          {
            id: "A2",
            text: "Which of the following is NOT a programming language?",
            options: ["Python", "JavaScript", "HTML", "Java"],
            type: "multiple-choice"
          },
          {
            id: "A3",
            text: "Which of these is a fundamental principle of academic integrity?",
            options: ["Plagiarism", "Honesty", "Cheating", "Dishonesty"],
            type: "multiple-choice"
          }
        ]
      },
      B: {
        title: "Section B",
        description: "Short Answer Questions",
        questions: [
          {
            id: "B1",
            text: "Explain the difference between qualitative and quantitative research methods.",
            type: "short-answer"
          },
          {
            id: "B2",
            text: "Describe the key principles of ethical research involving human subjects.",
            type: "short-answer"
          },
          {
            id: "B3",
            text: "Explain the importance of data security in modern information systems.",
            type: "short-answer"
          }
        ]
      },
      C: {
        title: "Section C",
        description: "Essay Question",
        questions: [
          {
            id: "C1",
            text: "Discuss the impact of artificial intelligence on the future of healthcare delivery. Include ethical considerations, potential benefits, and challenges in your response.",
            type: "essay"
          }
        ]
      }
    }
  };

  // Initialize camera and face detection
  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user' 
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        
        // Start simple face detection (in a real app, use a proper face detection library)
        startBasicFaceDetection();
      }
    } catch (err) {
      console.error("Camera error:", err);
      recordViolation("Camera access denied");
      alert("Camera access is required for this exam. Please enable camera permissions.");
    }
  };

  // Basic face detection simulation
  const startBasicFaceDetection = () => {
    // In a real implementation, you would use a proper face detection library
    // This is just a simulation that randomly detects faces
    faceDetectionInterval.current = setInterval(() => {
      const isFaceDetected = Math.random() > 0.1; // 90% chance of "detecting" face
      setFaceDetected(isFaceDetected);
      
      if (!isFaceDetected) {
        recordViolation("Face not detected");
      }
    }, 5000);
  };

  // Stop camera and face detection
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
    
    if (faceDetectionInterval.current) {
      clearInterval(faceDetectionInterval.current);
    }
  };

  // Anti-cheating measures
  useEffect(() => {
    if (!showInstructions && !fullscreen) {
      requestFullscreen();
    }

    // Set up event listeners to prevent cheating
    const handleVisibilityChange = () => {
      if (document.hidden && isTimerRunning) {
        recordViolation("Left exam tab");
        // Force user back to the exam
        alert("You cannot leave the exam tab. This incident has been recorded.");
        window.focus();
      }
    };

    const handleKeyDown = (e) => {
      // Prevent all function keys, context menu, etc.
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'p' || e.key === 's' || e.key === 'a' || e.key === 'x')) ||
        (e.altKey && (e.key === 'Tab' || e.key === 'F4')) ||
        e.key === 'PrintScreen' ||
        e.key === 'F1' || e.key === 'F2' || e.key === 'F3' || e.key === 'F4' || 
        e.key === 'F5' || e.key === 'F6' || e.key === 'F7' || e.key === 'F8' ||
        e.key === 'F9' || e.key === 'F10' || e.key === 'F11' || e.key === 'F12' ||
        e.key === 'Escape'
      ) {
        e.preventDefault();
        recordViolation(`Attempted to use restricted key: ${e.key}`);
        return false;
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      recordViolation("Attempted to use context menu");
    };

    const handleBlur = () => {
      if (isTimerRunning) {
        recordViolation("Window lost focus");
        window.focus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('blur', handleBlur);

    // Prevent leaving the page
    const handleBeforeUnload = (e) => {
      if (isTimerRunning) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your exam progress will be lost and this may be recorded as a violation.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopCamera();
    };
  }, [showInstructions, fullscreen, isTimerRunning]);

  // Timer functionality
  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prevTimer => {
          const { hours, minutes, seconds } = prevTimer;
          
          if (hours === 0 && minutes === 0 && seconds === 0) {
            clearInterval(interval);
            submitExam();
            return prevTimer;
          }
          
          let newSeconds = seconds - 1;
          let newMinutes = minutes;
          let newHours = hours;
          
          if (newSeconds < 0) {
            newSeconds = 59;
            newMinutes -= 1;
          }
          
          if (newMinutes < 0) {
            newMinutes = 59;
            newHours -= 1;
          }
          
          return { hours: newHours, minutes: newMinutes, seconds: newSeconds };
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const requestFullscreen = () => {
    const docElement = document.documentElement;
    
    if (docElement.requestFullscreen) {
      docElement.requestFullscreen().catch(err => {
        console.error("Fullscreen error:", err);
        recordViolation("Failed to enter fullscreen");
      });
    } else if (docElement.mozRequestFullScreen) {
      docElement.mozRequestFullScreen();
    } else if (docElement.webkitRequestFullscreen) {
      docElement.webkitRequestFullscreen();
    } else if (docElement.msRequestFullscreen) {
      docElement.msRequestFullscreen();
    }
    
    setFullscreen(true);
  };

  const recordViolation = (violationType) => {
    // In a real system, this would send a record to the server
    console.log(`Security violation: ${violationType} at ${new Date().toISOString()}`);
    setViolationCount(prev => prev + 1);
    
    // After 3 violations, automatically submit the exam
    if (violationCount >= 2) {
      alert(`Multiple violations detected. Your exam is being submitted automatically.`);
      submitExam();
    } else {
      alert(`Security violation detected: ${violationType}. This incident has been recorded. ${3 - violationCount} violations remaining before automatic submission.`);
    }
  };

  const handleStartExam = () => {
    setShowInstructions(false);
    setCurrentSection('A');
    setCurrentQuestion(examData.sections['A'].questions[0]);
    setIsTimerRunning(true);
    initializeCamera();
    requestFullscreen();
  };

  const handleSectionChange = (section) => {
    setCurrentSection(section);
    setCurrentQuestion(examData.sections[section].questions[0]);
  };

  const handleQuestionChange = (question) => {
    setCurrentQuestion(question);
  };

  const handleAnswerChange = (e) => {
    const value = e.target.value;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleMultipleChoiceAnswer = (option) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: option
    }));
  };

  const handleSaveAnswer = () => {
    console.log(`Answer saved for question ${currentQuestion.id}`);
    alert(`Answer for question ${currentQuestion.id} saved successfully!`);
  };

  const submitExam = () => {
    // In a real implementation, this would submit all answers to the backend
    alert("Exam submitted successfully!");
    console.log("Submitting exam answers:", answers);
    setIsTimerRunning(false);
    stopCamera();
    
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    
    // Navigate to a thank you page or some completion page
    // navigate('/exam-complete');
  };

  // Render instructions page
  if (showInstructions) {
    return (
      <div className={styles.examContainer}>
        <div className={styles.instructionsContainer}>
          <div className={styles.universityLogo}>
            <h2>Clarke International University</h2>
          </div>
          <h1>{examData.instructions.title}</h1>
          <div className={styles.instructions}>
            {examData.instructions.content.map((instruction, index) => (
              <p key={index}>{instruction}</p>
            ))}
          </div>
          <div className={styles.startButtonContainer}>
            <button className={styles.startButton} onClick={handleStartExam}>
              Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // / Determine if we need to show the next/prev question buttons
  const currentSectionQuestions = examData.sections[currentSection].questions;
  const currentQuestionIndex = currentSectionQuestions.findIndex(q => q.id === currentQuestion?.id);
  const hasPrevQuestion = currentQuestionIndex > 0;
  const hasNextQuestion = currentQuestionIndex < currentSectionQuestions.length - 1;

  return (
    <div className={styles.examContainer}>
      <div className={styles.examHeader}>
        <div className={styles.universityLogo}>
          <h3>Clarke International University</h3>
        </div>
        <div className={styles.examTimer}>
          Time Remaining: {String(timer.hours).padStart(2, '0')}:
          {String(timer.minutes).padStart(2, '0')}:
          {String(timer.seconds).padStart(2, '0')}
        </div>
      </div>
      
      <div className={styles.examContent}>
        <div className={styles.sidebar}>
          {Object.keys(examData.sections).map(sectionKey => (
            <div key={sectionKey} className={styles.sectionNav}>
              <div 
                className={`${styles.sectionHeader} ${currentSection === sectionKey ? styles.activeSectionHeader : ''}`}
                onClick={() => handleSectionChange(sectionKey)}
              >
                {examData.sections[sectionKey].title}
              </div>
              
              {currentSection === sectionKey && (
                <div className={styles.questionList}>
                  {examData.sections[sectionKey].questions.map(question => (
                    <div 
                      key={question.id}
                      className={`${styles.questionItem} ${currentQuestion?.id === question.id ? styles.activeQuestion : ''}`}
                      onClick={() => handleQuestionChange(question)}
                    >
                      {question.id}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          <div className={styles.proctoringStatus}>
            <h4>Proctoring Status</h4>
            <div className={styles.statusItem}>
              <span>Camera:</span>
              <span className={cameraActive ? styles.statusActive : styles.statusInactive}>
                {cameraActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className={styles.statusItem}>
              <span>Face Detection:</span>
              <span className={faceDetected ? styles.statusActive : styles.statusInactive}>
                {faceDetected ? 'Detected' : 'Not Detected'}
              </span>
            </div>
            <div className={styles.statusItem}>
              <span>Violations:</span>
              <span className={violationCount > 0 ? styles.statusWarning : styles.statusGood}>
                {violationCount}
              </span>
            </div>
          </div>
          
          <button className={styles.submitButton} onClick={submitExam}>
            Submit Exam
          </button>
        </div>
        
        <div className={styles.questionContainer}>
          {currentQuestion && (
            <>
              <div className={styles.questionHeader}>
                <h3>{examData.sections[currentSection].title}: Question {currentQuestion.id}</h3>
                <p className={styles.questionType}>{examData.sections[currentSection].description}</p>
              </div>
              
              <div className={styles.questionContent}>
                <p className={styles.questionText}>{currentQuestion.text}</p>
                
                {currentQuestion.type === 'multiple-choice' && (
                  <div className={styles.multipleChoiceContainer}>
                    {currentQuestion.options.map((option, index) => (
                      <div 
                        key={index} 
                        className={`${styles.optionItem} ${answers[currentQuestion.id] === option ? styles.selectedOption : ''}`}
                        onClick={() => handleMultipleChoiceAnswer(option)}
                      >
                        <span className={styles.optionLetter}>{String.fromCharCode(65 + index)}</span>
                        <span className={styles.optionText}>{option}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {(currentQuestion.type === 'short-answer' || currentQuestion.type === 'essay') && (
                  <textarea
                    className={`${styles.answerTextarea} ${currentQuestion.type === 'essay' ? styles.essayTextarea : ''}`}
                    value={answers[currentQuestion.id] || ''}
                    onChange={handleAnswerChange}
                    placeholder={`Type your ${currentQuestion.type === 'essay' ? 'essay' : 'answer'} here...`}
                  />
                )}
              </div>
              
              <div className={styles.questionNavigation}>
                {hasPrevQuestion && (
                  <button 
                    className={styles.navButton}
                    onClick={() => handleQuestionChange(currentSectionQuestions[currentQuestionIndex - 1])}
                  >
                    Previous Question
                  </button>
                )}
                
                <button 
                  className={styles.saveButton}
                  onClick={handleSaveAnswer}
                >
                  Save Answer
                </button>
                
                {hasNextQuestion && (
                  <button 
                    className={styles.navButton}
                    onClick={() => handleQuestionChange(currentSectionQuestions[currentQuestionIndex + 1])}
                  >
                    Next Question
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        
        <div className={styles.cameraContainer}>
          <h4>Proctoring Camera</h4>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={styles.cameraFeed}
          />
          <div className={styles.faceDetectionStatus}>
            Face Detection: {faceDetected ? (
              <span className={styles.detected}>Active</span>
            ) : (
              <span className={styles.notDetected}>Not Detected</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamInterface;