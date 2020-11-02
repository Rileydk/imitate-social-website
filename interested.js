// 所有added都移除後沒有渲染提示

const BASE_URL = 'https://lighthouse-user-api.herokuapp.com'
const INDEX_URL = BASE_URL + '/api/v1/users/' // + id = specific user info in JSON
const USERS_PER_PAGE = 24

const panelContainer = document.querySelector('#panel-container')
const usersPanel = document.querySelector('#users-panel')
const paginator = document.querySelector('#paginator')
const cardListTogglerContainer = document.querySelector('#card-list-toggler-container')
const cardToggler = document.querySelector('#card-toggler')
const listToggler = document.querySelector('#list-toggler')
const userModalAddInterested = document.querySelector('#user-modal-add-interested')
const deleteConfirmModal = document.querySelector('#delete-confirmation')
const deleteConfirmModalContent = document.querySelector('#delete-confirmation-content')

const state = {
  cardClickCount: 0,
  currentPage: 1,
  cardOrList: 'card'
}

const model = {
  interestedPersonsIds: JSON.parse(localStorage.getItem('interestedPerson')) || [],
  interestedPersonsDatas: [],
  filteredUsers: [],
  slicedUsers: [],
  totalPages: 0,
  deleteTargetId: 0,

  getUsersByPage(datas, page) {
    const startData = (page - 1) * USERS_PER_PAGE
    return datas.slice(startData, startData + USERS_PER_PAGE)
  },

  renewInterestedPersons(id) {
    const index = model.interestedPersonsIds.findIndex(addedId => Number(addedId) === id)
    model.interestedPersonsIds.splice(index, 1)
    model.interestedPersonsDatas.splice(index, 1)
    localStorage.setItem('interestedPerson', JSON.stringify(model.interestedPersonsIds))
  }
}

const view = {
  renderLayout(interested, page) {
    const datas = model.getUsersByPage(interested, page)
    controller.isPanelCardOrList() ? this.renderPanelCard(datas) : this.renderPanelList(datas)
    this.renderPaginator(interested, page)
  },

  renderNoOriginalDataLayout() {
    let rawHTML = ''
    rawHTML = `
      <div id="no-result-container" class="h-50 d-flex justify-content-center align-items-center">
        <div id="no-result-box" class="mx-auto p-2">
          <p id="no-result" class="font-weight-bold m-0">You haven\'t add any person into Interested List yet!</p>
        </div>
      </div>
    `
    usersPanel.classList.add('d-flex', 'justify-content-center')
    usersPanel.innerHTML = rawHTML
  },

  singleCardHTMLTemplate(data) {
    return `
        <div class="card-group card m-4" data-id="${data.id}">
          <img src="${data.avatar}" class="card-group user-avatar card-img-top" data-id="${data.id}" alt="User Thumbnail">
          <div class="card-group card-added-background card-body" data-id="${data.id}">
            <p class="card-group card-added-color card-title font-weight-bold text-center" data-id="${data.id}">${data.name} ${data.surname}</p>
          </div>
        </div>
      </div>
    `
  },

  singleListHTMLTemplate(data) {
    return `
      <img class="user-list-image list-added-avatar list-user-info-btn float-right rounded-circle" src="${data.avatar}" alt="User Image" data-id="${data.id}">
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
          <i class="list-add-favorite-btn fas fa-heart fa-lg" data-id="${data.id}"></i>
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
        $('#user-info-modal').modal('show')
      })
  },

  hideUserInfoModal() {
    $('#user-info-modal').modal('hide')
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

  showDeleteConfirmModal(datas, id) {
    const target = datas.find(data => data.id === Number(id))
    deleteConfirmModalContent.innerHTML = `Are you sure you want to remove ${target.name} ${target.surname} from your Interested list?
    `
    $('#delete-confirmation').modal('show')
  },

  hideDeleteConfirmModal() {
    $('#delete-confirmation').modal('hide')
  },

  renderCardTogglerClicked() {
    cardToggler.classList.add('toggler-clicked')
    listToggler.classList.remove('toggler-clicked')
  },

  renderListTogglerClicked() {
    cardToggler.classList.remove('toggler-clicked')
    listToggler.classList.add('toggler-clicked')
  }
}

const controller = {
  setup() {
    this.ajaxDatas(model.interestedPersonsIds)
    this.appendPrimaryListener()
  },

  ajaxDatas(interestedIds) {
    axios.get(INDEX_URL).then(res => {
      const rawDatas = res.data.results
      interestedIds.forEach(id => model.interestedPersonsDatas.push(rawDatas.find(data => data.id === Number(id))))
      this.checkInterestedExist()

    })
  },

  checkInterestedExist() {
    if (!model.interestedPersonsIds.length) {
      view.renderNoOriginalDataLayout()
    } else {
      view.renderLayout(model.interestedPersonsDatas, 1)
    }
  },

  appendPrimaryListener() {
    panelContainer.addEventListener('click', event => controller.dispatchPanelEventTask(event))
    cardListTogglerContainer.addEventListener('click', event => this.dispatchTogglerEventTask(event))
    userModalAddInterested.addEventListener('click', function userModalClickEventSendTHIS(event) {
      controller.onUserModalRemoveBtnClicked(event, this)
    })
    deleteConfirmModal.addEventListener('click', event => this.checkDeleteEvent(event))
  },

  dispatchPanelEventTask(event) {
    const target = event.target
    if (target.matches('.card-group')) {
      this.dispatchCardGroupAction(event.target.dataset.id)
    } else if (target.matches('.list-add-favorite-btn')) {
      model.deleteTargetId = Number(event.target.dataset.id)
      view.showDeleteConfirmModal(model.interestedPersonsDatas, model.deleteTargetId)
    } else if (target.matches('.list-user-info-btn')) {
      view.showUserInfoModal(target.dataset.id)
    } else if (event.target.matches('.paginator-group')) {
      this.checkPaginatorEvent(event)
    }
  },

  dispatchCardGroupAction(id) {
    state.cardClickCount++
    setTimeout(() => {
      switch (state.cardClickCount) {
        case 2:
          model.deleteTargetId = Number(id)
          view.showDeleteConfirmModal(model.interestedPersonsDatas, id)
          break
        case 1:
          view.showUserInfoModal(id)
      }
      state.cardClickCount = 0
    }, 300)
  },

  dispatchTogglerEventTask(event) {
    if (event.target.matches('#card-toggler')) {
      state.cardOrList = 'card'
      view.renderCardTogglerClicked()
    } else if (event.target.matches('#list-toggler')) {
      state.cardOrList = 'list'
      view.renderListTogglerClicked()
    }
    view.renderLayout(model.interestedPersonsDatas, state.currentPage)
  },

  isPanelCardOrList() {
    return state.cardOrList === 'card'
  },

  checkDeleteEvent(event) {
    if (event.target.matches('#delete-confirmation-btn')) {
      view.hideDeleteConfirmModal()
      model.renewInterestedPersons(model.deleteTargetId)
      view.renderLayout(model.interestedPersonsDatas, state.currentPage)
    }
  },

  onUserModalRemoveBtnClicked(event, caller) {
    view.hideUserInfoModal()
    model.deleteTargetId = Number(caller.dataset.id)
    view.showDeleteConfirmModal(model.interestedPersonsDatas, model.deleteTargetId)
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
    view.renderLayout(model.interestedPersonsDatas, state.currentPage)
  }
}

////// Main ///
controller.setup()