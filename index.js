// Features
// 1. skim through users on the website.
// 2. single click on the card to read more info about the person.
// 3. dblclick on the card to add persons into your interested list, you can also add them through info modal.
// 4. dblclick again to remove the added persons from interested list.
// 5. put keywords into the search column to search specific persons.
// 6. click on the paginator to move to another page or view your interested list.

const BASE_URL = 'https://lighthouse-user-api.herokuapp.com'
const INDEX_URL = BASE_URL + '/api/v1/users/' // + id = specific user info in JSON
const USERS_PER_PAGE = 24

const panelContainer = document.querySelector('#panel-container')
const usersPanel = document.querySelector('#users-panel')
const paginator = document.querySelector('#paginator')
const searchColumn = document.querySelector('#search-column')
const searchColumnDiv = document.querySelector('#search-column-div')
const searchColumnBtn = document.querySelector('#search-column-btn')
const cardListTogglerContainer = document.querySelector('#card-list-toggler-container')
const cardToggler = document.querySelector('#card-toggler')
const listToggler = document.querySelector('#list-toggler')
const userModalAddInterested = document.querySelector('#user-modal-add-interested')
const deleteConfirmModal = document.querySelector('#delete-confirmation')
const deleteConfirmModalContent = document.querySelector('#delete-confirmation-content')


const state = {
  cardClickCount: 0,
  currentPage: 1,
  cardOrList: 'card',
  addOrDelete: 'neither',
  searchingOrNot: 'not',
  duringNoSearchResult: 0
}


const model = {
  usersDatasArr: [],
  usersDatasObj: {},
  interestedPersonsIds: JSON.parse(localStorage.getItem('interestedPerson')) || [],
  filteredUsers: [],
  slicedUsers: [],
  totalPages: 0,
  deleteTargetId: 0,
  searchColumnEventTypes: ['keyup', 'mouseover', 'mouseout'],
  excludedKeyCodes: [
    8, //backspace
    9, //tab
    16, //shift
    17, //ctrl
    18, //alt
    91, //command
    20, //caps lock
    37, //left arrow
    38, //up arrow
    39, //right arrow
    40, //down arrow
    46, //del
  ],

  arrangeOriginalData(rawDataArr, processedDataArr, processedDataObj) {
    processedDataArr.push(...rawDataArr)
    rawDataArr.forEach(data => processedDataObj[data.id] = data)
  },

  getUsersByPage(datas, page) {
    const startData = (page - 1) * USERS_PER_PAGE
    return datas.slice(startData, startData + USERS_PER_PAGE)
  },

  getInterestedByPage(slicedDatas, interested) {
    return interested.filter(item => slicedDatas.some(data => data.id === Number(item)))
  },

  renewInterestedPersonsIds(id) {
    switch (state.addOrDelete) {
      case 'add':
        model.interestedPersonsIds.unshift(id)
        break
      case 'delete':
        const index = model.interestedPersonsIds.findIndex(addedId => Number(addedId) === id)
        model.interestedPersonsIds.splice(index, 1)
    }
    localStorage.setItem('interestedPerson', JSON.stringify(model.interestedPersonsIds))
  }
}


const view = {
  renderLayout(processedDataArr, page, interested) {
    const datas = model.getUsersByPage(processedDataArr, page)
    const interestedListByPage = model.getInterestedByPage(datas, interested)
    controller.isPanelCardOrList() ? this.renderPanelCard(datas) : this.renderPanelList(datas)
    interestedListByPage.forEach(id => {
      controller.decideWayToRenderInterestedPerson(processedDataArr, id)
    })
    this.renderPaginator(processedDataArr, page)
  },

  renderNoOriginalDataLayout() {
    let rawHTML = ''
    rawHTML = `
      <div id="no-result-container" class="h-50 d-flex justify-content-center align-items-center">
        <div id="no-result-box" class="mx-auto p-2">
          <p id="no-result" class="font-weight-bold m-0">0 Users on the website.\nInvite your friends to join us now!</p>
        </div>
      </div>
    `
    usersPanel.classList.add('d-flex', 'justify-content-center')
    usersPanel.innerHTML = rawHTML
  },

  // 字太長的時候card-body會破版（例如搜尋aa時），怎麼解決比較好？
  singleCardHTMLTemplate(data) {
    return `
        <div class="card-group card m-4" data-id="${data.id}">
          <img src="${data.avatar}" class="card-group user-avatar card-img-top" data-id="${data.id}" alt="User Thumbnail">
          <div class="card-group card-body" data-id="${data.id}">
            <p class="card-group card-title font-weight-bold text-center" data-id="${data.id}">${data.name} ${data.surname}</p>
          </div>
        </div>
      </div>
    `
  },

  singleListHTMLTemplate(data) {
    return `
      <img class="user-list-image list-user-info-btn float-right rounded-circle" src="${data.avatar}" alt="User Image" data-id="${data.id}">
      <div>
        <p class="list-title font-weight-bold text-center">${data.name} ${data.surname}</p>
      </div>
      <div class="d-flex">
        <p class="list-content mr-4">${data.gender}</p>
        <p class="list-content mr-4">${data.age} years old</p>
        <p class="list-content mr-4">${data.region}</p>
      </div> 
      <div class="d-flex justify-content-between align-items-center">
        <a href="#/" class="list-add-favorite-btn lg-icon-container btn rounded-circle mr-3 d-flex align-items-center" data-id="${data.id}">
          <i class="list-add-favorite-btn far fa-heart fa-lg" data-id="${data.id}"></i>
        </a>
        <a href="#/" class="list-user-info-btn lg-icon-container btn rounded-circle mr-3 d-flex align-items-center" data-id="${data.id}">
          <i class="list-user-info-btn fas fa-address-book fa-lg" data-id="${data.id}"></i>
        </a>
      </div>
    `
  },

  renderPanelCard(datasArr) {
    let rawHTML = ''
    datasArr.forEach(data => {
      rawHTML += `<div class="card-container d-flex justify-content-center align-items-center col-lg-3 col-md-4 col-sm-6">`
      rawHTML += this.singleCardHTMLTemplate(data)
      rawHTML += `</div>`
    })
    usersPanel.classList.remove('d-flex', 'justify-content-center')
    usersPanel.innerHTML = rawHTML
  },

  renderPanelList(datasArr) {
    let rawHTML = ''
    rawHTML += `<ul class="list-group w-100">`
    datasArr.forEach(data => {
      rawHTML += `<li class="list-group-item d-flex justify-content-around align-items-center">`
      rawHTML += this.singleListHTMLTemplate(data)
      rawHTML += `</li>`
    })
    rawHTML += `</ul>`
    usersPanel.classList.remove('d-flex', 'justify-content-center')
    usersPanel.innerHTML = rawHTML
  },

  renderInterestedPersonCard(index, data) {
    usersPanel.children[index].innerHTML = this.singleCardHTMLTemplate(data)
    if (state.addOrDelete === 'add' || state.addOrDelete === 'neither') {
      const target = usersPanel.children[index].children[0].children[1]
      target.classList.add('card-added-background')
      target.children[0].classList.add('card-added-color')
    }
  },

  renderInterestedPersonList(index, data, id) {
    usersPanel.children[0].children[index].innerHTML = this.singleListHTMLTemplate(data)
    if (state.addOrDelete === 'add' || state.addOrDelete === 'neither') {
      const target = usersPanel.children[0].children[index]
      target.children[0].classList.add('list-added-avatar')
      target.children[3].children[0].innerHTML = `<i class="list-add-favorite-btn fas fa-heart fa-lg" data-id="${id}"></i>`
    }
  },

  renderPaginator(datas, page) {
    this.renderColorlessPaginator(datas)
    this.changeExteriorOfPaginator(page)
  },

  renderColorlessPaginator(datas) {
    model.totalPages = Math.ceil(datas.length / USERS_PER_PAGE) || 1
    let rawHTML = ''
    rawHTML += `
      <li class="paginator-group page-item">
        <a id="page-previous" class="paginator-group page-previous-group page-link" href="#" aria-label="Previous">
          <span class="paginator-group page-previous-group " aria-hidden="true">&laquo;</span>
        </a>
      </li>
    `
    for (let page = 1; page <= model.totalPages; page++) {
      rawHTML += `
        <li class="paginator-group page-item">
          <a class="paginator-group page-link" href="#" data-page="${page}">${page}</a>
        </li>
      `
    }
    rawHTML += `
        <li class="paginator-group page-item">
          <a id="page-next" class="paginator-group page-next-group page-link" href="#" aria-label="Next">
            <span class="paginator-group page-next-group " aria-hidden="true">&raquo;</span>
          </a>
        </li>
    `
    paginator.innerHTML = rawHTML
  },

  changeExteriorOfPaginator(page) {
    for (let index = 1; index <= paginator.children.length - 1; index++) {
      paginator.children[index].className = 'page-item'
    }
    paginator.children[page].classList.add('active')
  },

  removePaginator() {
    paginator.innerHTML = ''
  },

  renderCardTogglerClicked() {
    cardToggler.classList.add('toggler-clicked')
    listToggler.classList.remove('toggler-clicked')
  },

  renderListTogglerClicked() {
    cardToggler.classList.remove('toggler-clicked')
    listToggler.classList.add('toggler-clicked')
  },

  showUserInfoModal(id) {
    axios.get(INDEX_URL + id)
      .then(res => {
        const userImage = document.querySelector('#user-modal-image')
        const userDescript = document.querySelector('#user-modal-descript')
        userModalAddInterested.dataset.id = id
        const data = res.data

        userImage.src = data.avatar
        userDescript.innerHTML =
          `<b>${data.name} ${data.surname}</b><br>
          Gender: ${data.gender}<br>
          Age: ${data.age}<br>
          Region: ${data.region}<br>
          Birthday: ${data.birthday}<br>
         `
        userDescript.innerHTML += `
          Email: <a href="mailto:${data.email}">${data.email}</a>
        `

        if (controller.addedBefore(id)) {
          userModalAddInterested.innerHTML = `<i class="fas fa-heart fa-lg"></i>`
        } else {
          userModalAddInterested.innerHTML = `<i class="far fa-heart fa-lg"></i>`
        }

        $('#user-info-modal').modal('show')
      })
  },

  // toggleModalBtn (event, caller) {
  //   if (!addedBefore(caller.dataset.id)) {
  //     if (event.type === 'mouseenter') {
  //       userModalAddInterested.innerHTML = `<i class="fas fa-heart fa-lg"></i>`
  //     } else if (event.type === 'mouseout') {
  //       userModalAddInterested.innerHTML = `<i class="far fa-heart fa-lg"></i>`
  //     }
  //   }
  // },

  hideUserInfoModal() {
    $('#user-info-modal').modal('hide')
  },

  showDeleteConfirmModal(datas, id) {
    const target = datas.find(data => data.id === Number(id))
    deleteConfirmModalContent.innerHTML = `Are you sure you want to remove ${target.name} ${target.surname} from your Interested list?
    `
    $('#delete-confirmation').modal('show')
  },

  hideDeleteConfirmModal() {
    $('#delete-confirmation').modal('hide')
  },

  alertPageLocation(location, destination) {
    return alert(`You're at the ${location} page of Meet: You're Social Website.\nThere's no ${destination} page.
    `)
  },

  toggleSearchColumn() {
    if (event.type === 'mouseover') {
      searchColumnDiv.style.width = '400px'
      searchColumnBtn.style.left = '360px'
      searchColumnBtn.style.color = '#ededed'
    } else if (event.type === 'mouseout') {
      searchColumnDiv.style.width = '200px'
      searchColumnBtn.style.left = '160px'
      searchColumnBtn.style.color = '#636c75'
    }

  },

  alertIvalidInput() {
    return alert('Invalid input.')
  },

  alertNoSearchResult() {
    return alert(`The persons you're looking for haven't registered on our website yet.\nInvite them to join us!
    `)
  },

  renderNoSearchResult() {
    let rawHTML = ''
    rawHTML = `
      <div id="no-result-container" class="h-50 d-flex justify-content-center align-items-center">
        <div id="no-result-box" class="mx-auto p-2">
          <p id="no-result" class="font-weight-bold m-0">Not Found</p>
        </div>
      </div>
    `
    usersPanel.classList.add('d-flex', 'justify-content-center')
    usersPanel.innerHTML = rawHTML
  }
}


const controller = {
  setup() {
    this.ajaxDatas()
    this.appendPrimaryListener()
  },

  ajaxDatas() {
    axios.get(INDEX_URL).then(res => {
      const rawDatas = res.data.results
      model.arrangeOriginalData(rawDatas, model.usersDatasArr, model.usersDatasObj)
      this.checkOriginalDataExist()
    })
  },

  checkOriginalDataExist() {
    if (!model.usersDatasArr.length) {
      view.renderNoOriginalDataLayout()
    } else {
      view.renderLayout(model.usersDatasArr, 1, model.interestedPersonsIds)
    }
  },

  appendPrimaryListener() {
    panelContainer.addEventListener('click', event => controller.dispatchPanelEventTask(event))
    model.searchColumnEventTypes.forEach(eventType => searchColumn.addEventListener(eventType, event => this.dispatchSearchColumnEventTask(event)))
    cardListTogglerContainer.addEventListener('click', event => this.dispatchTogglerEventTask(event))
    //arrow function不能抓到this，只能用這個方法？
    userModalAddInterested.addEventListener('click', function userModalClickEventSendTHIS(event) {
      // 在這裡面屬於controller的不能用this來調用？
      controller.distributeUserModalEventType(event, this)
    })
    deleteConfirmModal.addEventListener('click', event => this.checkDeleteEvent(event))
  },

  // decideUsersPerPage () {
  //   const USERS_PER_PAGE = (state.cardOrList === 'card') ? CARD_USERS_PER_PAGE : LIST_USERS_PER_PAGE
  //   return USERS_PER_PAGE
  // },

  decideWayToRenderInterestedPerson(datas, id) {
    const slicedDatas = model.getUsersByPage(datas, state.currentPage)
    const index = slicedDatas.findIndex(item => item.id === Number(id))
    const target = slicedDatas[index]
    if (state.cardOrList === 'card') {
      view.renderInterestedPersonCard(index, target)
    } else if (state.cardOrList === 'list') {
      view.renderInterestedPersonList(index, target, id)
    }
  },

  dispatchPanelEventTask(event) {
    const target = event.target
    if (target.matches('.card-group')) {
      this.dispatchCardGroupAction(event.target.dataset.id)
    } else if (target.matches('.list-add-favorite-btn')) {
      this.distinguishAddedOrNot(event.target.dataset.id)
    } else if (target.matches('.list-user-info-btn')) {
      view.showUserInfoModal(target.dataset.id)
    } else if (event.target.matches('.paginator-group')) {
      this.checkPaginatorEvent(event)
    }
  },

  dispatchCardGroupAction(id) {
    state.cardClickCount++
    // 要在輸入同時即時顯示搜尋結果，又要區分click和dblclick的話，除了延遲以外有沒有更好的做法？（setTimeout使單擊跳出時間延遲許多）
    // 如果沒有其他做法，代表這本來就不是個好設計？
    setTimeout(() => {
      switch (state.cardClickCount) {
        case 2:
          // 為什麼這裡第一次dblclick的時候傳入2次，接下來都只剩1次？ //還有這個問題嗎？
          this.distinguishAddedOrNot(id)
          break
        case 1:
          view.showUserInfoModal(id)
      }
      state.cardClickCount = 0
    }, 300)
  },

  decideDataToBeUsed() {
    return (state.searchingOrNot === 'searching') ? model.filteredUsers : model.usersDatasArr
  },

  distinguishAddedOrNot(id) {
    if (!this.addedBefore(id)) {
      state.addOrDelete = 'add'
      model.renewInterestedPersonsIds(id)
      this.decideWayToRenderInterestedPerson(this.decideDataToBeUsed(), id)
    } else {
      state.addOrDelete = 'delete'
      model.deleteTargetId = Number(id)
      view.showDeleteConfirmModal(this.decideDataToBeUsed(), id)
    }
  },

  addedBefore(id) {
    return model.interestedPersonsIds.some(person => person === id)
  },

  isPanelCardOrList() {
    return state.cardOrList === 'card'
  },

  dispatchTogglerEventTask(event) {
    if (event.target.matches('#card-toggler')) {
      state.cardOrList = 'card'
      view.renderCardTogglerClicked()
    } else if (event.target.matches('#list-toggler')) {
      state.cardOrList = 'list'
      view.renderListTogglerClicked()
    }
    state.addOrDelete = 'neither'
    view.renderLayout(this.decideDataToBeUsed(), state.currentPage, model.interestedPersonsIds)
  },

  distributeUserModalEventType(event, caller) {
    // if (event.type === 'click') {
    this.distinguishAddedOrNot(caller.dataset.id)
    view.hideUserInfoModal()
    // } 
    // else if (event.type === 'mouseenter' || event.type === 'mouseout') {
    //   view.toggleModalBtn(event, caller)
    // }
  },

  checkDeleteEvent(event) {
    if (event.target.matches('#delete-confirmation-btn')) {
      view.hideDeleteConfirmModal()
      model.renewInterestedPersonsIds(model.deleteTargetId)
      this.decideWayToRenderInterestedPerson(this.decideDataToBeUsed(), model.deleteTargetId)
    }
  },

  checkPaginatorEvent(event) {
    if (event.target.matches('.page-previous-group')) {
      if (state.currentPage === 1) {
        return view.alertPageLocation('first', 'previous')
      }
      state.currentPage--
    } else if (event.target.matches('.page-next-group')) {
      if (state.currentPage === model.totalPages) {
        return view.alertPageLocation('last', 'next')
      }
      state.currentPage++
    } else {
      const page = Number(event.target.dataset.page)
      state.currentPage = page
    }
    state.addOrDelete = 'neither'
    view.renderLayout(this.decideDataToBeUsed(), state.currentPage, model.interestedPersonsIds)
  },

  dispatchSearchColumnEventTask(event) {
    if (event.type === 'keyup') {
      this.checkInputIsValid(event)
    } else {
      view.toggleSearchColumn()
    }
  },

  checkInputIsValid(event) {
    const inputValue = searchColumn.value.trim().toLowerCase()
    // Avoid alert when delete all the input
    if (!inputValue && !this.isExcludedKeyCode(event)) {
      state.searchingOrNot = 'not'
      return view.alertIvalidInput()
    }
    controller.checkSearchResultExist(event, inputValue)
  },

  checkSearchResultExist(event, inputValue) {
    // 非英語姓名的部分好像怪怪的？（如搜尋'a'的第4頁）
    model.filteredUsers = model.usersDatasArr.filter(user => user.surname.toLowerCase().includes(inputValue) || user.name.toLowerCase().includes(inputValue))
    if (!model.filteredUsers.length) {
      state.searchingOrNot = 'not'
      // 為什麼明明render在先，卻會先alert才render？
      view.removePaginator()
      view.renderNoSearchResult()
      if (!this.isExcludedKeyCode(event) && !state.duringNoSearchResult) {
        state.duringNoSearchResult = 1
        view.alertNoSearchResult(event)
      }
      return
    }
    state.searchingOrNot = 'searching'
    state.addOrDelete = 'neither'
    view.renderLayout(model.filteredUsers, 1, model.interestedPersonsIds)
    state.duringNoSearchResult = 0
  },

  isExcludedKeyCode(event) {
    return model.excludedKeyCodes.some(code => code == event.keyCode)
  }
}


//// Main //////////
controller.setup()


//mouseover和mouseenter會覆蓋掉click嗎？原因？解決方法？
//為什麼直接寫['mouseenter', 'mouseout'].forEach(...）會失效？但repl.it這樣寫好像沒問題。
// const userModalEventTypes = ['mouseenter', 'mouseout'] 
// userModalEventTypes.forEach(eventType => 
//   userModalAddInterested.addEventListener(eventType, function userModalMouseEventSendTHIS(event) {
//     distributeUserModalEventType(event, this)
//   })
// )


// 載入速度好慢，這是正常的嗎？
// 好像偶爾會在重整頁面command+R的時候還是跳出alert？
// 確認執行順序 => AB函式接續排列，A函式中會再調用a函式，B會比a更早被調用？想要確保順序，只能用傳入函式的方式處理？這是非同步問題？
// 如何移除監聽器？