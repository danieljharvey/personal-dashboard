import { loop, Cmd } from "redux-loop";
import { Middleware, MiddlewareAPI, Dispatch } from "redux";
import {
  TypeKeys as RecognitionActionTypes,
  Action as RecognitionAction,
  reset as resetRecognition
} from "../recognition/logic";
import { IApplicationState } from "../../store";
import { requestMissingHours } from "../missing-hours/logic";

export enum TypeKeys {
  NAVIGATE_TO_HOME = "app/NAVIGATE_TO_HOME",
  TIMER_STARTED = "app/TIMER_STARTED",
  TIMER_TICK = "app/TIMER_TICK",
  TIMER_STOPPED = "app/TIMER_STOPPED"
}

const SHOW_WHO_IS_THIS_VIEW_FOR = 60000;

type Action =
  | INavigateToHomeAction
  | IStartTimerAction
  | ITickAction
  | IStopTimerAction;

interface INavigateToHomeAction {
  type: TypeKeys.NAVIGATE_TO_HOME;
}

function navigateToHome(): INavigateToHomeAction {
  return {
    type: TypeKeys.NAVIGATE_TO_HOME
  };
}
interface IStartTimerAction {
  type: TypeKeys.TIMER_STARTED;
}

function startTimer(): IStartTimerAction {
  return {
    type: TypeKeys.TIMER_STARTED
  };
}
interface IStopTimerAction {
  type: TypeKeys.TIMER_STOPPED;
}

function stopTimer(): IStopTimerAction {
  return {
    type: TypeKeys.TIMER_STOPPED
  };
}

interface ITickAction {
  type: TypeKeys.TIMER_TICK;
}

function tick(): ITickAction {
  return {
    type: TypeKeys.TIMER_TICK
  };
}

function wait1Second() {
  return new Promise(resolve => setTimeout(resolve, 1000));
}

export interface IState {
  currentView: "home" | "dashboard" | "who is this";
  timeLeftInWhoIsThisView: null | number;
  isAwake: boolean;
}

const initialState: IState = {
  currentView: "home",
  timeLeftInWhoIsThisView: null,
  isAwake: false
};

export function reducer(
  state: IState = initialState,
  action: Action | RecognitionAction
) {
  switch (action.type) {
    case RecognitionActionTypes.FACES_DETECTED:
      if (action.payload.detection.amount > 0) {
        return { ...state, isAwake: true };
      }
      return state;
    case RecognitionActionTypes.FACE_RECOGNISED:
      if (action.payload.names.length === 0 && state.currentView === "home") {
        return loop(
          { ...state, currentView: "who is this" },
          Cmd.action(startTimer())
        );
      }

      return loop(
        { ...state, currentView: "dashboard" },
        Cmd.action(requestMissingHours(action.payload.names[0]))
      );

    case RecognitionActionTypes.FACE_SAVED:
      return loop(
        { ...state, currentView: "home" },
        Cmd.action(resetRecognition())
      );

    case TypeKeys.NAVIGATE_TO_HOME:
      if (state.currentView === "who is this") {
        return state;
      }
      return loop(
        { ...state, isAwake: false, currentView: "home" },
        Cmd.action(resetRecognition())
      );

    /*
     * "Who is this?"" - view -> "Home" - view timer
     */
    case TypeKeys.TIMER_STARTED:
      return loop(
        { ...state, timeLeftInWhoIsThisView: SHOW_WHO_IS_THIS_VIEW_FOR },
        Cmd.run(wait1Second, {
          successActionCreator: tick
        })
      );

    case TypeKeys.TIMER_STOPPED:
      return loop(
        { ...state, currentView: "home" },
        Cmd.action(resetRecognition())
      );

    case TypeKeys.TIMER_TICK:
      const timeLeft = (state.timeLeftInWhoIsThisView as number) - 1000;
      if (timeLeft === 0) {
        return loop(
          { ...state, timeLeftInWhoIsThisView: null },
          Cmd.action(stopTimer())
        );
      }

      const newState = { ...state, timeLeftInWhoIsThisView: timeLeft };
      return loop(
        newState,
        Cmd.run(wait1Second, {
          successActionCreator: tick
        })
      );
  }
  return state;
}

export interface IAppMiddleware<K> extends Middleware {
  <S extends K>(api: MiddlewareAPI<S>): (next: Dispatch<S>) => Dispatch<S>;
}
export const timerMiddleware: IAppMiddleware<IApplicationState> = <
  S extends IApplicationState
>(
  api: MiddlewareAPI<S>
) => (next: Dispatch<S>) => {
  let timeout: null | number = null;

  return (action: any) => {
    const currentView = api.getState().app.currentView;

    const shouldReset =
      action.type === RecognitionActionTypes.FACE_REAPPEARED ||
      (action.type === RecognitionActionTypes.FACE_RECOGNISED &&
        action.payload.names.length > 0);

    if (shouldReset && timeout !== null) {
      window.clearTimeout(timeout);
      timeout = null;
    }

    const shouldSetTimer =
      action.type === RecognitionActionTypes.FACES_DETECTED &&
      action.payload.detection.amount === 0 &&
      currentView === "dashboard";

    if (shouldSetTimer && !timeout) {
      timeout = window.setTimeout(() => {
        api.dispatch(navigateToHome());
        timeout = null;
      }, 5000);
    }
    return next(action);
  };
};
