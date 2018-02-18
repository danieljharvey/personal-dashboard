import { connect } from "react-redux";
import { App, IProps, IDispatchProps } from "./component";
import { IApplicationState } from "../../store";
import {
  facesDetected,
  submitFace,
  toggleTracking
} from "../recognition/logic";

function mapStateToProps(state: IApplicationState) {
  return {
    currentView: state.app.currentView,
    currentlyRecognized: state.recognition.currentlyRecognized[0],
    latestRecognitionCandidate: state.recognition.latestRecognitionCandidate,
    latestDetection: state.recognition.latestDetection,
    faceBuffer: state.recognition.faceBuffer,
    trackingStoppedForDebugging: state.recognition.trackingStoppedForDebugging,
    firstFaceDetected: state.recognition.firstFaceDetected
  };
}

export default connect<IProps, IDispatchProps>(mapStateToProps, {
  facesDetected,
  submitFace,
  toggleTracking
})(App);