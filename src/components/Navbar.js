import React, {Component} from 'react'
import vote from '../vote.svg'
import { FormGroup, FormControlLabel, Switch } from "@mui/material";       // npm install @mui/material @emotion/react @emotion/styled
import Airdrop from './Airdrop.js'
import './Navbar.css'; 
import chairperson from "../chairperson.svg";

class Navbar extends Component {
    // our react goes in here
    render() {

        return (
            <nav className="navbar navbar-dark fixed-top shadow p-0 navbar-responsive" style={{ display: "flex", backgroundColor: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(5px)", minHeight: "80px"}}>
                <a className="navbar-brand col-sm-3 col-md-2 me-0 nav-icon" href="http://localhost:3000/">
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <img
                    src={vote}
                    width="30"
                    height="30"
                    className="d-inline-block align-top"
                    alt="bank"
                    />
                    &nbsp; DAPP Ballot
                </a>
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
                                        }} 
                                    >
                                        {this.props.labelId === 7 ? this.props.txMsg : ''}
                                    </label>
                            </form>
                        :
                            <Airdrop curTimestamp={this.props.curTimestamp} endTime={this.props.endTime}/> )
                    :
                    <></>
                }

                <div className="d-flex flex-column align-items-end ms-auto flex-wrap">
                    <ul className="navbar-nav px-4">
                        <li className="text-nowrap nav-item d-block">
                            <span style={{ color: "white", fontSize: "15px" }}>
                                <b>ACCOUNT NUMBER:</b> {this.props.account}
                            </span>
                        </li>
                    </ul>
                
                    <FormGroup className="navbar-nav px-2" style={{ display: "flex", alignItems: "center", gap: "10px" }} >
                        <FormControlLabel 
                            control= {<Switch 
                                        checked={this.props.chairperson}
                                        onChange={ (event) => {
                                                this.props.setChairperson(this.props.chairperson)
                                        }}
                                        sx={{
                                            // "& .MuiSwitch-switchBase.Mui-checked": {
                                            // color: "#0d47a1", // Κίτρινο όταν είναι ON
                                            // },
                                            // "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                            // backgroundColor: "#ffcc00", // Κίτρινο background όταν είναι ON
                                            // },
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
                                        color="white"
                                        className= { this.props.chairperson ? "chairperson-svg-on" : "chairperson-svg-off" }
                                    />
                                </div>
                            }
                            style={{color: "white"}}
                        />
                    </FormGroup>
                </div>
                {/* <img src={chairperson} alt="ChairPerson" width="32" className="chairperson-icon"/> */}
            </nav>
        )
    }
}

export default Navbar;