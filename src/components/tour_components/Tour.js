import {withStyles} from "@material-ui/core/styles";
import React, {useEffect, useMemo, useState} from "react";
import useTheme from "@material-ui/core/styles/useTheme";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Paper from "@material-ui/core/Paper";
import TourPlacesWrapper from "./TourPlacesWrapper";
import PlaceSearch from "./PlaceSearch";
import DaysWrapper from "./DaysWrapper";
import TourDataReducer from "./TourReducer";
import TourInfoComponent from "./TourInfoComponent";
import Divider from "@material-ui/core/Divider";
import TourMap from "./TourMap";
import Button from "@material-ui/core/Button";
import API from "../../Networking/API";
import UseSnackbarContext from "../../contexts/UseSnackbarContext";
import shortid from 'shortid';
import CircularProgress from "@material-ui/core/CircularProgress";
import RecommendationListDialog from "../recomendation/RecommendationListDialog";
import {RecommendationType} from "../recomendation/Recommendation";
import history from "../../helpers/history";
import TransportItem from "./TransportItem";

export const ElementType = {
  place: 0,
  transport: 1
}
export const PlaceType = {
  api: 1,
  local: 0
}

const styles = theme => ({
  root: {
    [theme.breakpoints.down("lg")]: {
      overflow: "scroll",
    },
    [theme.breakpoints.up("lg")]: {
      overflow: "initial",
      display: "flex",
    },
    height: `calc(100% - 64px)`,
    width: "100%",
    '&::-webkit-scrollbar': {
      display: "none"
    },
  },
  loader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100vw",
    height: "100vh"
  },
  rightLayout: {
    flex: 2,
    '&::-webkit-scrollbar': {
      display: "none"
    },
    [theme.breakpoints.up("lg")]: {
      height: "100%",
      overflowY: "scroll",

    },
  },
  leftLayout: {
    [theme.breakpoints.up("lg")]: {
      height: "100%",
    },
    overflowY: "scroll",

    flex: 1,
    '&::-webkit-scrollbar': {
      display: "none"
    },
  },
  actionsArea: {
    padding: theme.spacing(1),
    display: "flex",
    justifyContent: "flex-end"
  },

})

const sampleTourData = {
  name: "",
  description: "",
  isVerified: true,
  isPublished: false,
  days: [
    {
      description: "",
      elementIdentifier: "jkasfbjkdsbjk",
      tour: []
    }
  ]
}

function Tour({classes, match}) {

  const [localPlacesFound, setLocalPlacesFound] = useState([])
  const [apiPlacesFound, setApiPlacesFound] = useState([])
  const [currentDay, setCurrentDay] = useState(0)
  const [tourId, setTourId] = useState(match.params.tourId)
  const [isLoading, setIsLoading] = useState(match.params.tourId !== undefined);
  const [recommendationsDialogOpen, setRecommendationsDialogOpen] = useState(false)

  const [selectedCategories, setSelectedCategories] = useState([])
  const [availableCategories, setAvailableCategories] = useState([])

  const [errorInfo, setErrorInfo] = useState({
        errors: {
          titleMissing: false,
          /* Any client-side verification errors may by added here, and handled in individual components */
        },
        showErrors: false
      }
  )

  const [tourInfo, dispatchTourInfo] = React.useReducer(TourDataReducer, sampleTourData)
  const {addConfig} = UseSnackbarContext();

  const handleAddPlaceClick = (placeInfo, type) => {
    dispatchTourInfo({
      type: 'ADD_ELEMENT',
      day: currentDay,
      data: {
        type: ElementType.place,
        data: {
          type: type,
          details: {...placeInfo},
          transport: {fk_transportId: 3},
          note: ''
        },
      },
      onError: () => {
        addConfig(false, "This place already exists in this tour.")
      }
    })
  }

  const removeElementCallback = (index) => {
    dispatchTourInfo({
      type: 'REMOVE_ELEMENT',
      day: currentDay,
      index: index
    })
  };

  const handleEditPlace = (placeId) => {
    window.open(`https://www.traveldirection.ax.lt/app/addplace/${placeId}`);
  }

  useEffect(() => {
    if (tourId !== undefined) { //If user wants to edit a tour, we download all tour data. loadData also downloads categories
      loadData()
    } else { //Otherwise, we just download categories instead.
      API.Categories.getAllCategories().then(response => {
        setAvailableCategories(response)
      }).catch(() => {
        addConfig(false, "Categories failed to load")
      })
    }
  }, [])

  const parseTourInfoResponse = (response) => {
    let aggregatedDays = [];
    response.days.forEach(day => {
      let aggregatedElements = [];
      day.data.forEach(place => {
        let aggregatedPlace = {
          type: ElementType.place,
          data: {
            details: place.place, type: place.place.type, transport: place.transport == null ? {fk_transportId: 3} : {
              fk_transportId: place.transport.fk_transportId - 1
            }, note: place.note == null ? '' : place.note
          }
        }
        delete aggregatedPlace.data.details.type
        aggregatedElements.push(aggregatedPlace)
      })
      let aggregatedDay = {...day, tour: aggregatedElements, elementIdentifier: shortid.generate()}
      delete aggregatedDay.data
      aggregatedDays.push(aggregatedDay)
    })
    let aggregatedTour = {...response, days: aggregatedDays}
    dispatchTourInfo({type: 'SET_ALL', data: aggregatedTour})
  }

  const loadData = () => {
    Promise.all([
          API.Tour.getTour("?id=" + tourId),
          API.Categories.getAllCategories(),
          API.Tour.getTourCategories("?id=" + tourId),
        ]
    ).catch(() => {
      addConfig(false, "Tour has failed to load")
      setTourId(undefined)
    }).then((response) => {
      parseTourInfoResponse(response[0])
      setAvailableCategories(response[1])
      setSelectedCategories(response[2])
    }).finally(() => {
      setIsLoading(false)
    })
  }

  const handleSave = () => {
    let containsErrors = false;
    Object.keys(errorInfo.errors).map(function (keyName, keyIndex) {
      if (errorInfo.errors[keyName]) {
        setErrorInfo(state => {
          return {...state, showErrors: true}
        })
        containsErrors = true;
      }
    })
    if (containsErrors) return
    setErrorInfo(state => {
      return {...state, showErrors: false}
    })

    const aggregatedDays = []
    tourInfo.days.forEach(day => {
      let aggregatedDay = {...day, data: []}
      delete aggregatedDay.tour
      delete aggregatedDay.elementIdentifier
      for (let i = 0; i < day.tour.length; i++) {
        let element = day.tour[i]
        if (element.type !== ElementType.place)
          continue;
        let aggregatedPlace = {
          place: {
            type: element.data.type,
            placeId: element.data.details.placeId
          },
          note: element.data.note
        }
        if (i !== day.tour.length - 1)
          aggregatedPlace.transport = {fk_transportId: element.data.transport.fk_transportId + 1}
        else
          aggregatedPlace.transport = {fk_transportId: null}

        aggregatedDay.data.push(aggregatedPlace)
      }
      aggregatedDays.push(aggregatedDay)
    })
    let aggregatedTour = {...tourInfo, days: aggregatedDays}

    if (tourId === undefined) {
      API.Tour.insertTour(aggregatedTour).then((response) => {
        setTourId(response)
        return response
      }).then((response) => Promise.all(
          [
            API.Tour.updateTourCategories(selectedCategories, "?p=" + response)
          ]
      )).then((() => {
        addConfig(true, "Tour has been inserted successfully!")
      })).catch((error) => {
        addConfig(false, "Something went wrong while saving this tour.")
      })
    } else {
      Promise.all([
        API.Tour.updateTour(aggregatedTour, "?id=" + tourId),
        API.Tour.updateTourCategories(selectedCategories, "?p=" + tourId)
      ])
          .then(() => {
            addConfig(true, "Tour has been updated successfully!")
          }).catch((error) => {
        addConfig(false, "Something went wrong while saving this tour.")
      })
    }

  };

  const leftLayout = useMemo(() => (
      <div className={classes.leftLayout}>
        <PlaceSearch addPlaceCallback={handleAddPlaceClick} localPlacesFound={localPlacesFound}
                     setLocalPlacesFound={setLocalPlacesFound} apiPlacesFound={apiPlacesFound}
                     setApiPlacesFound={setApiPlacesFound}/>
      </div>
  ), [localPlacesFound, apiPlacesFound, currentDay])


  let dayInfoWithoutDesc = JSON.stringify(tourInfo.days.map(day => {
    let dayCopy = {...day}
    delete dayCopy.description
    return dayCopy.tour.map(day => day.data.details)
  }))


  const tourPlacesMemoized = useMemo(() => (<TourPlacesWrapper errorInfo={errorInfo} setErrorInfo={setErrorInfo}
                                                               handleEditPlace={handleEditPlace}
                                                               currentDay={currentDay} tourInfoReducer={dispatchTourInfo} tourInfo={tourInfo}/>), [errorInfo, currentDay, JSON.stringify(tourInfo.days.map(day => day.tour))])
  const mapComponent = useMemo(() => (
      <React.Fragment>
        <TourMap tourInfo={tourInfo}
                 currentDay={currentDay}
                 addPlace={handleAddPlaceClick}
                 removePlace={removeElementCallback}
        />
      </React.Fragment>
  ), [dayInfoWithoutDesc, currentDay])

  const daysWrapperMemoized = useMemo(() => (<DaysWrapper currentDay={currentDay} setCurrentDay={setCurrentDay}
                                                          tourInfo={tourInfo}
                                                          tourInfoReducer={dispatchTourInfo}/>), [JSON.stringify(tourInfo.days.map(day => {
    return {...day, tour: null}
  }))])

  const tourDaysComponents = useMemo(() => (
      <div>
        {daysWrapperMemoized}
        <Divider variant="middle"/>
        {mapComponent}
        {tourPlacesMemoized}
      </div>
  ), [tourInfo.days, currentDay, errorInfo]);

  const tourInfoMemoized = useMemo(() => (
      <TourInfoComponent tourInfo={tourInfo} tourInfoReducer={dispatchTourInfo} errorInfo={errorInfo}
                         setErrorInfo={setErrorInfo}
                         tourId={tourId}
                         setSelectedCategories={setSelectedCategories} selectedCategories={selectedCategories}
                         availableCategories={availableCategories}
                         setAvailableCategories={setAvailableCategories}/>), [availableCategories, selectedCategories, tourId, errorInfo, tourInfo.name, tourInfo.description, tourInfo.isPublished, tourInfo.isVerified])

  const rightLayout = useMemo(() => (
      <Paper className={classes.rightLayout}>
        {tourInfoMemoized}
        <Divider variant="middle"/>
        {tourDaysComponents}
        <div className={classes.actionsArea}>
          <Button variant="contained" color="primary" onClick={() => setRecommendationsDialogOpen(true)}
                  disabled={tourId == null}>
            Add tour to recommendation
          </Button>
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save this tour
          </Button>
        </div>
      </Paper>
  ), [tourInfo, currentDay, errorInfo, availableCategories, selectedCategories]);

  const theme = useTheme();
  const largeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  const content = (
      <React.Fragment>
        {largeScreen ?
            <React.Fragment>
              {leftLayout}
              {rightLayout}
            </React.Fragment> :
            <React.Fragment>
              {rightLayout}
              {leftLayout}
            </React.Fragment>
        }
      </React.Fragment>
  );

  return (
      <div className={classes.root}>
        <RecommendationListDialog
            setOpen={setRecommendationsDialogOpen}
            open={recommendationsDialogOpen}
            objectId={tourId}
            type={RecommendationType.tour}/>
        {isLoading ? <div className={classes.loader}><CircularProgress/></div> : content}
      </div>
  )
}


export default withStyles(styles)(Tour)
