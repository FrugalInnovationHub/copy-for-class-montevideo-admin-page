import {useState, useRef} from 'react'
import { FaCaretDown, FaCaretUp } from 'react-icons/fa'


//button to click for sorting
const SortButton = ({field, sort, getFocusCol}) => {

  const [direction, setDirection] = useState(false);

  let focus = getFocusCol()
  const symbol = useRef()
 
  //decided which way arrow pointing based on how the col is sorted
  if(direction === false || focus !== field){
    symbol.current = <FaCaretDown color={'#0A7BF2'} />
  }else if(direction === true){
    symbol.current = <FaCaretUp color={'#0A7BF2'}/>
  }

  return (
    <button className="btn-clear" onClick={() => {
      setDirection(!direction)
      sort(field)
      }}>
      {symbol.current}
    </button>
  )
}
