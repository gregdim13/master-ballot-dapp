import React, { Component } from "react";
import { Hourglass } from "react-loader-spinner";

class Timer extends Component {
    constructor(props) {
        super(props);
        const remainingTime = Math.max(0, parseInt(this.props.endTime, 10) - parseInt(this.props.curTimestamp, 10)); // Εμποδίζουμε αρνητικές τιμές

        this.state = {
            time: this.secondsToTime(remainingTime),
            seconds: remainingTime,
        };
        this.timer = null;
    }

    componentDidMount() {
        if (this.state.seconds > 0) {
            this.startTimer();
        }
    }

    componentWillUnmount() {
        this.stopTimer();
    }

    startTimer = () => {
        if (!this.timer && this.state.seconds > 0) {  // ✅ Έλεγχος για αποφυγή διπλού setInterval
            this.timer = setInterval(this.countDown, 1000);
        }
    };

    stopTimer = () => {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    };

    countDown = () => {
        this.setState((prevState) => {
            let seconds = prevState.seconds - 1;

            if (seconds <= 0) {
                this.stopTimer(); // ✅ Διακοπή όταν φτάσει στο 0
                return { seconds: 0, time: this.secondsToTime(0) };
            }

            return { seconds, time: this.secondsToTime(seconds) };
        });
    };

    secondsToTime(secs) {
        let hours = Math.floor(secs / 3600);
        let minutes = Math.floor((secs % 3600) / 60);
        let seconds = secs % 60;
        return { h: hours, m: minutes, s: seconds };
    }

    render() {

        const duration = this.state.seconds > 0 ? this.state.seconds * 1000 : 1500;
        return (

            <span className="ms-1 text-warning" style={{ fontSize: "18px", fontWeight: "bold" }}>
                {this.state.seconds > 0 && (
                    <Hourglass
                        visible={true}
                        height="22"
                        width="22"
                        ariaLabel="hourglass-loading"
                        wrapperStyle={{}}
                        wrapperClass="hourglass-wrapper"
                        colors={['#FFD700', '#ece497']} // Δύο αποχρώσεις κίτρινου
                        duration={duration}
                    />
                )}
                ⏳ Time: {String(this.state.time.h).padStart(2, "0")}:{String(this.state.time.m).padStart(2, "0")}:{String(this.state.time.s).padStart(2, "0")}
            </span>

        );
    }
}

export default Timer;
