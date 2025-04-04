import React, {Component} from 'react';
import vote from '../assets/vote.svg';
import { FormGroup, FormControlLabel, Switch } from "@mui/material";
import Timer from './Timer.js';
import './Navbar.css';
import chairperson from "../assets/chairperson.svg";

class Navbar extends Component {
    render() {
        return (
            <nav className="navbar navbar-dark fixed-top shadow p-0 navbar-responsive" style={{
                display: "flex",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(5px)",
                minHeight: "90px"
            }}>
                {/* Λογότυπο και σύνδεσμος του DApp που οδηγεί στην αρχική σελίδα */}
                <a className="navbar-brand nav-icon col-sm-3 col-md-1 me-0 d-flex align-items-center"
                    href="http://localhost:3000/"
                    style={{paddingLeft: "20px"}}>
                    <img
                        src={vote}
                        width="64"
                        height="64"
                        className="d-inline-block align-top"
                        alt="bank"
                    />
                    <div className="ms-3 d-flex flex-column" style={{fontSize: "18px", fontWeight: "bold", lineHeight: "1.4"}}>
                        <span>Decentralized</span>
                        <span>Voting</span>
                        <span>Application</span>
                    </div>
                </a>
                {/* Προβολή του χρονόμετρου ή του κουμπιού έναρξης εκλογών ανάλογα με το state startVoting */}
                <div className="col-auto ms-4" style={{paddingLeft: "110px"}}>
                {
                    !this.props.loading ? 
                        (!this.props.startVoting ?
                            <form 
                                onSubmit={(event) => {
                                    event.preventDefault()
                                    this.props.startElections()
                                }}
                                className='mx-2 mb-2 mt-2' 
                                style= {{ display: "flex", alignItems: "center", fontWeight: "bold" }}
                            >
                                <button type='submit' className='custom-button'>Start Elections</button>
                                <label id='7' className='float-left' 
                                        style={{ 
                                            marginLeft: '30px', 
                                            color: 'red',
                                            fontSize: '14px',
                                            marginLeft: '10px'
                                        }} 
                                    >
                                        {this.props.labelId === 7 ? this.props.txMsg : ''}
                                    </label>
                            </form>
                        :
                            <Timer curTimestamp={this.props.curTimestamp} endTime={this.props.endTime}/> )
                    :
                    <></>
                }
                </div>

                {/* Εμφάνιση διεύθυνση λογαριασμού χρήστη και διακόπτη TOGGLE SWITCH για την ενεργοποίηση λειτουργιών chairperson */}
                <div className="d-flex flex-column align-items-end ms-auto flex-wrap">
                    <ul className="navbar-nav px-4">
                        <li className="text-nowrap nav-item d-block">
                            <span style={{ color: "white", fontSize: "15px" }}>
                                <b>ACCOUNT:</b> {this.props.account}
                            </span>
                        </li>
                    </ul>
                
                    <FormGroup className="navbar-nav px-2" style={{ display: "flex", alignItems: "center", gap: "10px" }} >
                        <FormControlLabel 
                            control={<Switch 
                                        checked={this.props.chairperson}
                                        onChange={(event) => {
                                            this.props.setChairperson(this.props.chairperson)
                                        }}
                                        sx={{
                                            "& .MuiSwitch-track": {
                                                backgroundColor: "#666", // Γκρι όταν είναι OFF, ώστε να φαίνεται στο μαύρο φόντο
                                            },
                                        }}
                                    />}
                            label={
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{color: this.props.chairperson ? "#1976D2" : "white"}}><b>Chairperson</b></span>
                                    <img 
                                        src={chairperson} 
                                        alt="ChairPerson" 
                                        className={ this.props.chairperson ? "chairperson-svg-on" : "chairperson-svg-off" }
                                    />
                                </div>
                            }
                            style={{color: "white"}}
                        />
                    </FormGroup>
                </div>
            </nav>
        )
    }
}

export default Navbar;
