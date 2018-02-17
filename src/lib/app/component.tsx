import * as React from "react";
import styled from "styled-components";
import { Camera } from "../../components/Camera";
import { IState } from "./logic";
import { WhoIsThis } from "./views/WhoIsThis";
import { IDetection, withTracking } from "../../utils/withTracking";
import { DEBUG } from "../../utils/config";

const Container = styled.div`
  position: relative;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: #abffab;
`;

const DebugCamera = styled(Camera)`
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 2;
`;

export interface IProps {
  currentlyRecognized: null | string;
  latestDetectionImageWithFaces: null | Blob;
  currentView: IState["currentView"];
}

export interface IDispatchProps {
  recognizeFaces: (event: IDetection) => void;
  submitFace: (name: string) => void;
}

const TrackingCamera = styled(withTracking(Camera))`
  width: 100%;
`;

export class App extends React.Component<IProps & IDispatchProps> {
  private submitFace = (name: string) => {
    this.props.submitFace(name);
  };

  public render() {
    return (
      <Container>
        {(this.props.currentView === "home" ||
          // We want to keep on tracking while the dashboard is open
          // to detect no faces in the image
          this.props.currentView === "dashboard") && (
          <TrackingCamera onFacesDetected={this.props.recognizeFaces} />
        )}

        {this.props.currentView === "dashboard" && (
          <Overlay>
            <h1>{this.props.currentlyRecognized}</h1>
          </Overlay>
        )}
        {this.props.currentView === "who is this" &&
          this.props.latestDetectionImageWithFaces && (
            <WhoIsThis
              onSave={this.submitFace}
              image={this.props.latestDetectionImageWithFaces}
            />
          )}
        {DEBUG && <DebugCamera />}
      </Container>
    );
  }
}
