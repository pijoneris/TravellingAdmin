import React, {useContext, useEffect, useState} from "react";
import PropTypes from "prop-types";
import {withStyles} from "@material-ui/core/styles";
import TableComponent from "../components/TableComponent";
import API from "../Networking/API";
import Button from "@material-ui/core/Button";
import AddIcon from "@material-ui/icons/Add"
import Box from "@material-ui/core/Box";
import history from "../helpers/history";
import UseAlertDialogContext from "../contexts/UseAlertDialogContext";
import Strings from "../helpers/stringResources";
import UseSnackbarContext from "../contexts/UseSnackbarContext";
import FilterBlock from "../components/add_place_components/FilterBlock";
import {PlacesFilterContext} from "../contexts/PlacesFilterContext";
import {AppStateStorageContext} from "../contexts/AppStateStorageContext";

const styles = theme => ({
    button: {
        margin: theme.spacing(2)
    },
    input: {
        display: "none"
    },
    root: {
        height: "100vh",
        width: "100%",
        overflow: "auto"
    },
    buttonsDiv: {
        backgroundColor: "red",
        justifyContent: "flex-end"
    },
    content: {
        display: 'flex',
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        [theme.breakpoints.down("lg")]: {
            padding: theme.spacing(1),
        },
        [theme.breakpoints.up("lg")]: {
            padding: theme.spacing(8),
        },
    },
    autocomplete: {
        width: '200px',
        height: '40px',
        fontSize: "14px",
        border: "0",
        borderBottom: "2px solid grey",
        outline: "0",
        marginBottom: "4px"
    }
});


const headCells = [
    {id: 'name', numeric: false, disablePadding: false, label: 'Place name', isId: true},
    {id: 'address', numeric: false, disablePadding: false, label: 'Address', isId: false},
    {id: 'city', numeric: false, disablePadding: false, label: 'City', isId: false},
    {id: 'country', numeric: false, disablePadding: false, label: 'Country', isId: false},
    {id: 'dateModified', numeric: false, disablePadding: false, label: 'Date modified', isId: false},
    {id: 'actions', numeric: false, disablePadding: false, label: 'Actions', isId: false}
];

function Places(props) {

    const [data, setData] = useState([]);
    const [pageData, setPageData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const {classes} = props;


    const {filterQuery} = useContext(PlacesFilterContext);
    const {addAlertConfig} = UseAlertDialogContext();
    const {addConfig} = UseSnackbarContext();

    const {placesPageConfig, savePlacesTableInfo} = useContext(AppStateStorageContext)

    useEffect(() => {
        setIsLoading(true);
        if(!isLoading){
            savePlacesTableInfo(placesPageConfig.keyword, 1);
            requestAllPlaces(1, placesPageConfig.keyword);
        }else{
            requestAllPlaces()
        }
    }, [filterQuery]);


    function getPlaceNameById(id) {
        for (var i = 0; i < data.length; i++) {
            if (data[i].placeId === id)
                return data[i].name
        }
    }

    function requestAllPlaces(p = placesPageConfig.page, keyword = placesPageConfig.keyword) {
        console.log(filterQuery + "&p=" + p + "&s=" + 10 + "&keyword=" + keyword);
        getAllPlaces(filterQuery + "&p=" + p + "&s=" + 10 + "&keyword=" + keyword);
    }

    function parseData(data) {
        setIsLoading(false);
        let placesData = [];
        data.list.map(row => {
            placesData.push(row)
        });

        delete data.list;
        setData(placesData);
        console.log(placesData);
        setPageData(data);
    }

    function updatePlaceCallback(id) {
        history.push("/app/addplace/" + id)
    }

    function removePlaceCallback(id) {
        setIsLoading(true);
        addAlertConfig(Strings.DIALOG_PLACE_DELETE_TITLE + " - " + getPlaceNameById(id), Strings.DIALOG_PLACE_DELETE_MESSAGE, [{
            name: "Remove",
            action: () => {
                API.Places.removePlace("?p=" + id).then(response => {
                    let tmp = [];
                    data.map(row => {
                        if (row.placeId !== id) {
                            tmp.push(row)
                        }
                    });
                    setData(tmp);
                    addConfig(true, Strings.SNACKBAR_PLACE_REMOVE_SUCCESS)
                    setIsLoading(false)
                }).catch(error => {
                    setIsLoading(false);
                    addConfig(false, Strings.SNACKBAR_ERROR)
                })
            }
        }], () => {
            setIsLoading(false)
        })
    }

    const changePageCallback = (p = 0, keyword = "") => {
        if(!isLoading){
            setIsLoading(true);
            savePlacesTableInfo(keyword, p)
            requestAllPlaces(p, keyword)
        }
    };

    return (
        <div className={classes.root}>
            <div className={classes.content}>
                <FilterBlock setOpen={true}/>

                <TableComponent
                    title={"Places"}
                    headCells={headCells}
                    data={data}
                    pagingInfo={pageData}
                    checkable={false}
                    changePageCallback={changePageCallback}
                    updateCallback={updatePlaceCallback}
                    removeCallback={removePlaceCallback}
                    initialKeyword={placesPageConfig.keyword}
                    id={"placeId"}
                    isLoading={isLoading}
                />

                <Box display="flex" justifyContent="flex-end">
                    <Button
                        onClick={() => {
                            history.push("/app/addplace")
                        }}
                        variant="text"
                        color="secondary"
                        size="large"
                        className={classes.button}
                        startIcon={<AddIcon/>}>
                        Add
                    </Button>
                </Box>
            </div>
            <Button>
                Clear filters
            </Button>
        </div>
    );

    function getAllPlaces(urlParams = "") {
        API.Places.getAllPlacesAdmin(urlParams).then(response => {
            setIsLoading(false);
            parseData(response)
        }).catch(error => {
            setIsLoading(false);
            console.log(error)
        })
    }
}

Places.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Places);