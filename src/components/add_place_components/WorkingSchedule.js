import React, {useState} from "react";
import withStyles from "@material-ui/core/styles/withStyles";
import Typography from "@material-ui/core/Typography";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import {Card} from "@material-ui/core";
import Schedule from "../Schedule";


const styles = theme => ({
    outline: {
        margin: theme.spacing(1),
        padding: theme.spacing(1),
        width: '100%'
    },
    button: {
        margin: theme.spacing(2)
    },
    paper:{
        padding: theme.spacing(2),
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "8px"
    },
});

function WorkingSchedule({classes, scheduleData, setScheduleData}) {
    const [workingScheduleEnabled, setWorkingScheduleEnabled] = useState(false);

    return <div>
        <Typography variant="subtitle1" >
            Working schedule
        </Typography>
        <FormControlLabel
            control={
                <Switch
                    checked={workingScheduleEnabled}
                    onChange={() => setWorkingScheduleEnabled(current => !current)}
                    color="primary"
                />
            }
            label="Enable working schedule for this place"
        />
        <br/>
        {workingScheduleEnabled &&

            <Schedule scheduleData={scheduleData} setScheduleData={setScheduleData}/>

        }
    </div>
}

export default withStyles(styles)(WorkingSchedule)