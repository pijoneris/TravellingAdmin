import React, {useContext, useEffect, useState} from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import history from "../helpers/history";
import UseSnackbarContext from "../contexts/UseSnackbarContext";
import LinearProgress from "@material-ui/core/LinearProgress";
import {AuthContext} from "../contexts/AuthContext";
import Redirect from "react-router-dom/es/Redirect";
import {isAuthenticated} from "../helpers/tokens";
import API from "../Networking/API";
import {func} from "prop-types";

function Copyright() {
    return (
        <Typography variant="body2" color="textSecondary" align="center">
            {'Copyright © '}
                Traveldirection {' '}
            {new Date().getFullYear()}
            {'.'}
        </Typography>
    );
}

const useStyles = makeStyles((theme) => ({
    paper: {
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.main,
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(1),
    },
    submit: {
        margin: theme.spacing(3, 0, 2),
    },
    loaderMain: {
        width: "100%",
        height: "100%",
        alignItems:"center",
        justifyContent: "center",
        backgroundColor: "red"
    }
}));

export default function LoginPage() {
    const classes = useStyles();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setIsLoading] = useState(false);
    const { addConfig } = UseSnackbarContext();
    const { currentUser, setCurrentUser } = useContext(AuthContext);

    const handleLogin = () =>{
        setIsLoading(true);
        console.log("handleLogin", {identifier: email, password: password});
        API.Auth.login({identifier: email, password: password}).then(response=>{
            if(!checkAccess(response.authorities)){
                addConfig(false, "Only admins and editors can access admin panel!")
                setIsLoading(false);
                return
            }
            setIsLoading(false);
            localStorage.setItem("access_token", response.access_token);
            localStorage.setItem("refresh_token", response.refresh_token);
            API.User.getUserProfile().then(response=>{
                console.log("User profile:", response);
                setCurrentUser(response);
                history.push("/app/home");
            }).catch(error=>{
                setIsLoading(false);
                addConfig(false, error.message)
            });
        }).catch(error=>{
            setIsLoading(false);
            addConfig(false, error.message)
        });
    };

    function checkAccess(roles){
        var hasAccess = false
        roles.map(row=>{
            console.log(row)
            if(row.authority === "ROLE_ADMIN"){
                hasAccess = true
            }
        });
        return hasAccess
    }

    if (isAuthenticated()) {
        return <Redirect to="/app" />;
    }

    const handleKeyPress = (event) =>{
        if (event.which === 13 || event.keyCode === 13) {
            handleLogin();
            return false;
        }
        return true;
    };

    return <Container component="main" maxWidth="xs" onKeyPress={(e)=>handleKeyPress(e)}>

                            {loading && <LinearProgress />}
                            <CssBaseline />
                            <div className={classes.paper}>
                                <Avatar className={classes.avatar}>
                                    <LockOutlinedIcon />
                                </Avatar>
                                <Typography component="h1" variant="h5">
                                    Sign in
                                </Typography>
                                <TextField
                                    variant="outlined"
                                    margin="normal"
                                    required
                                    fullWidth
                                    value={email}
                                    onChange={(e)=>{setEmail(e.target.value)}}
                                    id="email"
                                    label="Email Address"
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                />
                                <TextField
                                    variant="outlined"
                                    margin="normal"
                                    required
                                    value={password}
                                    onChange={(e)=>{setPassword(e.target.value)}}
                                    fullWidth
                                    name="password"
                                    label="Password"
                                    type="password"
                                    id="password"
                                    autoComplete="current-password"
                                />
                                <Button
                                    onClick={()=>{handleLogin()}}
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    className={classes.submit}
                                >
                                    Sign In
                                </Button>
                            </div>
                            <Box mt={8}>
                                <Copyright />
                            </Box>
                        </Container>

}