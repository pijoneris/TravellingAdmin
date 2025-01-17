import {arrayMove} from "react-sortable-hoc";
import {ElementType} from "./Tour";

export default function TourDataReducer(state, action) {

    let days = []

    switch (action.type) {
        case 'ADD_ELEMENT':
            if(state.days !== null && action.data.type === ElementType.place && state.days.some(day => day.tour !== null && day.tour.some(place => place.type === ElementType.place && place.data.details.placeId === action.data.data.details.placeId))){
                if(action.onError !== null && action.onError !== undefined){
                    action.onError()
                }
                return state
            }

            state.days.forEach((item, index) => {
                if (index === action.day) {
                    days.push({
                        ...item,
                        tour: [
                            ...item.tour,
                            action.data
                        ]
                    })
                } else days.push(item)
            })
            return {
                ...state,
                days: [
                    ...days
                ]
            }
        case 'UPDATE_ELEMENT':
            state.days.forEach((item, index) => {
                if (index === action.day) {
                    let tour = item.tour
                    tour[action.index] = {...tour[action.index], data: {...tour[action.index].data, ...action.data}}
                    days.push({
                        ...item,
                        tour: tour
                    })
                } else days.push(item)
            })
            return {
                ...state,
                days: [
                    ...days
                ]
            }
        case 'ADD_DAY':
            return {
                ...state,
                days: [
                    ...state.days,
                    action.data
                ]
            }
        case 'MOVE_DAY':
            return {
                ...state,
                days: arrayMove(state.days, action.oldIndex, action.newIndex)
            }
        case 'MOVE_ELEMENT':
            days = state.days.map((item, index) => {
                if (index === action.day)
                    return {...item, tour: arrayMove(item.tour, action.oldIndex, action.newIndex)}
                else return item
            })
            return {
                ...state,
                days: [
                    ...days
                ]
            }
        case 'UPDATE_DAY':
            days = state.days.map((item, index) => {
                if (index === action.day) {
                    return {...item, ...action.data}
                } else return item
            })
            return {
                ...state,
                days: [
                    ...days
                ]
            }
        case 'REMOVE_ELEMENT':
            days = state.days.map((item, index) => {
                if (index === action.day)
                    return {...item, tour: item.tour.filter((value, index) => index !== action.index)}
                else return item
            })
            return {
                ...state,
                days: [
                    ...days
                ]
            }
        case 'REMOVE_DAY':
            days = state.days.filter((item, index) => index !== action.day)
            return {
                ...state,
                days: days
            }
        case 'UPDATE_TOUR':
            return {
                ...state,
                ...action.data
            }
        case 'SET_ALL':
            return action.data

        default:
            return state
    }

}
