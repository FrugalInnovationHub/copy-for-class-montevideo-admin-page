import { useState, useEffect } from 'react'
import calls from '../api/calls'
import filter from '../helpers/sanitizeData'

const PickupItem = ({ pickup, cols }) => {

  const [ready, setReady] = useState(false)
  const [categoryData, setCategoryData] = useState()

  const options = {
    timeZone: 'America/Los_Angeles',
    timeStyle: "short",
    dateStyle: "short"
  }

  let display


  let datetime = new Date(pickup.datetime)
  let dateDisplay = datetime.toLocaleString('en-US', options)

  const genData = () => {
    setCategoryData(filter.sanitizePickupCategories(pickup, cols))
  }

  useEffect(() => {
    genData()
  }, [])

  const genDataDisplay = () => {
    if (categoryData) {
      let keys = Object.keys(categoryData)
      return keys.map((col) =>

        <td>{categoryData[col] !== 'N/A' ? categoryData[col].toFixed(2) : '0'}</td>

      )
    }
  }


  if (pickup && categoryData) {
    display = (
      <tr>
        <td>{filter.statusTranslate(pickup.status)}</td>
        <td>{dateDisplay}</td>
        {genDataDisplay()}


      </tr>
    )
  } else {
    display = <td colSpan={9}>Loading</td>
  }


  return (
    <>
      {display}
    </>
  )
}

export default PickupItem
