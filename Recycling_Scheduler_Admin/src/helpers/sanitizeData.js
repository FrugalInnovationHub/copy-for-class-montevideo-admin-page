const sanitizePickupCategories = (pickup, cols) => {

  let returnData = {
    'TotalWeight': 0,
    'AvgUsability': 0,
  }


  if(pickup.categories){

    cols.forEach(col => {
      returnData[col] = Number(0)
    })
  
    pickup.categories.forEach( cat => {
      if(cols.includes(cat.material.name)){
        returnData[cat.material.name] += Number(cat.weight)
      }
      returnData.TotalWeight += Number(cat.weight)
    })
  }

  if(returnData.TotalWeight){
    returnData.AvgUsability = (returnData.TotalWeight - returnData["Descarte"]) / returnData.TotalWeight * 100
  }else{
    returnData.AvgUsability = 'N/A'
  }


  return returnData
}

const getMaterialList = (pickups) => {

  let materials = []
  pickups.forEach(pickup => {
    if(pickup.categories){
      pickup.categories.forEach((category) => {
        let material = category.material.name
        if(!materials.includes(material)){
          materials.push(material)
        }
      })
    
    } 
  })

    return materials
}

const sort = (arr, field) => {

  if(arr.length <= 1){
    return arr;
  }

  let pivot = arr[0]
  let leftArr = []
  let rightArr = []

  for(let i = 1; i < arr.length; i++){
    if(arr[i][field] < pivot[field]){
      leftArr.push(arr[i])
    }else{
      rightArr.push(arr[i])
    }
  }

  return [...sort(leftArr, field), pivot, ...sort(rightArr, field)];

}


const generateMontlhyData = (pickups, targetMonth) => {


  const headers = ["Date", "Bags"]
  const data = []

 
  //generate headers

    const date = new Date()
    const targetYear = date.getFullYear()
    for(let i = 0; i < pickups.length; i++){
      if(pickups[i].categories){
      const tempDate = new Date(pickups[i].datetime)
        if(pickups[i].categories){
          for(let j = 0; j < pickups[i].categories.length; j++){
            let material = pickups[i].categories[j].material.name
            if(!headers.includes(material)){
              headers.push(material)
            }
          }
        }
    }
  }

  
  //generate current month
  for(let i = 0; i < pickups.length; i++){
    if(pickups[i].bags && pickups[i].categories){
      const tempDate = new Date(pickups[i].datetime)

      if(Number(tempDate.getMonth()) === Number(targetMonth) && pickups[i].bags.length > 0 && Number(tempDate.getFullYear()) === Number(targetYear)){
        console.log(pickups[i])
        let pickupData = [tempDate, pickups[i].bags.length]
        let cols = getMaterialList(pickups)
        let amounts = sanitizePickupCategories(pickups[i], cols)
        for(let j = 2; j < headers.length; j++){
          if(amounts[headers[j]]){
            pickupData.push(amounts[headers[j]].toFixed(2))
          }else{
            pickupData.push(0.0)
          }
        }
        data.push(pickupData)
      }else{
        continue
      }

    }
  }

  //generate past months
  const currentYear = new Date().getFullYear()
  let monthArray = new Array(12)
  for(let month = 0; month < 12; month++){
    let  curMonth = targetMonth - month
    let curMonthArr = []
    if(curMonth < 0){
      curMonthArr.push(`${12 - Math.abs(curMonth) + 1}/${currentYear - 1}`)
      curMonthArr.push(Number(0))
      curMonth = 12 - Math.abs(curMonth)
    }else{
      curMonthArr.push(`${curMonth + 1}/${currentYear}`)
      curMonthArr.push(Number(0))
    }
    

    for(let i = 0; i < pickups.length; i++){
      if(pickups[i].bags && pickups[i].categories && pickups[i].status === 'C'){
        const tempDate = new Date(pickups[i].datetime)
        let cols = getMaterialList(pickups)
        let amounts = sanitizePickupCategories(pickups[i], cols)

        console.log(amounts)

        if(tempDate.getMonth() === curMonth){
          curMonthArr[1] += Number(pickups[i].bags.length)
          for(let j = 2; j < headers.length; j++){
            if(amounts[headers[j]]){
              if(curMonthArr.length >= j + 1){
                curMonthArr[j] += amounts[headers[j]]
              }else{
                curMonthArr.push(amounts[headers[j]])
              }
            }else{
              if(curMonthArr.length >= j + 1){
                curMonthArr[j] += 0
              }else{
                curMonthArr.push(Number(0))
              }
            }

            
          }
          
        }
        monthArray[month] = curMonthArr
      }else if(pickups[i].bags){
        const tempDate = new Date(pickups[i].datetime)
      }
  }

  }
  data.push(["Past Months"])
  for(let i = 0; i < monthArray.length; i++){
    if(monthArray[i] !== undefined){
      for(let j = 2; j < monthArray[i].length; j++){
        if(typeof monthArray[i][j] === 'number'){
          monthArray[i][j] = monthArray[i][j].toFixed(2)
        }
      }
    
      data.push(monthArray[i])
    }
  }


  const returnData = {headers, data}

  return returnData
   
}

const roleTranslate = (role) => {
  switch(role){
    case 'admin':
      return 'Administrador'
    case 'collector':
      return 'Receptor'
    case 'classifier':
      return 'Clasificador'
    case 'both':
      return 'Receptor & Clasificador'
  }
}

const statusTranslate = (status) => {
  switch(status){
    case 'U':
      return 'No Cobrado'
    case 'P':
      return 'Recogida'
    case 'C':
      return 'Clasificado'
  }
}
 
 
const filter = {
  sanitizePickupCategories,
  getMaterialList,
  sort,
  generateMontlhyData,
  roleTranslate,
  statusTranslate
}

export default filter