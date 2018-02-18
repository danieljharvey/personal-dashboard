import * as React from "react";
import styled from "styled-components";
import * as annyang from "annyang";

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: #abffab;
`;

interface IProps {
  image: string;
  onSave: (name: string) => void;
}

export class WhoIsThis extends React.Component<IProps, { name: string }> {
  private commands: { [key: string]: (param: string) => void } = {};
  public state = {
    name: ""
  };

  public componentDidMount() {
    this.commands = {
      "my name is :name": (name: string) => {
        this.setState({ name });
      },
      "I'm :name": (name: string) => {
        this.setState({ name });
      },
      save: () => {
        this.props.onSave(this.state.name);
      },
      // Debug route
      hello: () => {
        alert("hello");
      }
    };

    // Add our commands to annyang
    annyang.addCommands(this.commands);

    // Start listening.
    annyang.start();
  }
  public componentWillUnmount() {
    annyang.removeCommands(Object.keys(this.commands));
  }

  public render() {
    const { image } = this.props;
    return (
      <Overlay>
        <h1>Who is this?</h1>
        <p>
          I'm ...<br />
          My name is ...
        </p>
        {this.state.name !== "" && (
          <div>
            <h2>Hey {this.state.name}</h2>
            <h2>say "save" when you're done</h2>
          </div>
        )}
        {image && <img src={image} />}
      </Overlay>
    );
  }
}