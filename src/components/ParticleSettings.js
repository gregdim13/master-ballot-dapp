// ParticleSettings.js
import React, { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import ethereumLogo from "../assets/ethereum-logo.svg";


const ParticleSettings = () => {
    const particlesInit = useCallback(async (engine) => {
        await loadFull(engine);
    }, []);

    const particlesLoaded = useCallback(async (container) => {
        console.log(container);
    }, []);

    return (
        <Particles
            id="tsparticles"
            init={particlesInit}
            loaded={particlesLoaded}
            options={{
                background: {
                    color: {
                        value: "#0d47a1",
                    },
                },
                fpsLimit: 60,
                interactivity: {
                    events: {
                        onClick: {
                            enable: true,
                            mode: "push",
                        },
                        onHover: {
                            enable: true,
                            mode: "repulse",
                        },
                        resize: true,
                    },
                    modes: {
                        push: {
                            quantity: 4,
                        },
                        repulse: {
                            distance: 170,
                            duration: 0.4,
                        },
                    },
                },
                particles: {
                    color: {
                        value: "#ffffff",
                    },
                    links: {
                        color: "#ffffff",
                        distance: 150,
                        enable: true,
                        opacity: 0.5,
                        width: 1,
                    },
                    // collisions: {
                    //     enable: true,
                    // },
                    move: {
                        direction: "none",
                        enable: true,
                        outModes: {
                            default: "bounce",
                        },
                        random: false,
                        speed: 3,
                        minSpeed: 3,
                        maxSpeed: 3, // Περιορισμός μέγιστης ταχύτητας
                        straight: false,
                    },
                    number: {
                        density: {
                            enable: true,
                            area: 800,
                        },
                        value: 80,
                    },
                    opacity: {
                        value: 0.5,
                    },
                    shape: {
                        type: "image",
                        image: {
                            src: ethereumLogo,
                            width: 50,
                            height: 50,
                        },
                    },
                    size: {
                        random: true,
                        value: 12,
                    },
                },
                detectRetina: true,
            }}
        />
    );
};

{/* <Particles
    id="tsparticles"
    init={particlesInit}
    loaded={particlesLoaded}
    options={{
        background: {
            color: {
                value: "#d11111",
            },
        },
        fpsLimit: 60,
        interactivity: {
            events: {
                onClick: {
                    enable: true,
                    mode: "push",
                },
                onHover: {
                    enable: true,
                    mode: "repulse",
                },
                resize: true,
            },
            modes: {
                push: {
                    quantity: 4,
                },
                repulse: {
                    distance: 200,
                    duration: 0.4,
                },
            },
        },
        particles: {
            color: {
                value: "#ff69b4", // Ροζ καρδιές
            },
            links: {
                color: "#ff0000", // Κόκκινες γραμμές σύνδεσης
                distance: 150,
                enable: true,
                opacity: 0.8,
                width: 2,
            },
            collisions: {
                enable: false, // Απενεργοποίηση συγκρούσεων
            },
            move: {
                direction: "none",
                enable: true,
                outModes: {
                    default: "bounce",
                },
                random: false,
                speed: 2, // Χαμηλότερη αρχική ταχύτητα
                maxSpeed: 2.5, // Περιορισμός μέγιστης ταχύτητας
                //decay: 0.01, // Σταδιακή επιβράδυνση για αποφυγή επιτάχυνσης
                straight: false,
            },
            number: {
                density: {
                    enable: true,
                    area: 800,
                },
                value: 50, // Λίγο λιγότερες καρδιές για καλύτερη αισθητική
            },
            opacity: {
                value: 0.9,
            },
            shape: {
                type: "character",
                character: {
                    value: "❤", // Καρδούλες
                    font: "Verdana",
                    style: "",
                    weight: "bold",
                    fill: true,
                },
            },
            size: {
                random: true,
                value: 16, // Μεγαλύτερες καρδιές για να ξεχωρίζουν
            },
        },
        detectRetina: true,
    }}
/> */}


export default ParticleSettings;
