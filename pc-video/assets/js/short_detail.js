var app = new Vue({
	el: '#app',
	data: {
		shortTravelInfo: null,
		travelId: 0,
		playData: [],
		playDataLength: 0,
		posterUrl: '',
		authName: '',
		authId: 0,
		authAvatar: '',
		lastUpdateDate: '',
		takeTime: '',
		currentPlayIndex: 0,
		progressWidth: 0,
		progressItemWidth: 0,
		step: 5,
		mediaObj: null,
		isPlay: false,
		recordProgress: [],
		duration: 0,
		dataIndex:0,
		dataList: dataList,
		dataListLen: dataList.length,
		dataTotal: 2,
		commentList: [],
		commentTimer: null,
		isShowTitle: false,
		resizeTimer: null,
		commentStartTimer: null,
		isShowPause: false,
		hidePauseTimer: null,
		isLoading: true,
		isEnd: false
	},
	methods: {
		init: function () {
			var _this = this;

			// 获取当前data数据
			this.shortTravelInfo = this.dataList[this.dataIndex];

			// 获取基础信息
			this.getTravelInfo();

			// 标题处理
			_this.checkTitleState();

			// 获取评论信息
			this.getCommentList();

			// 初始化进度条记录数组
			this.initRecordProgress();

			//计算进度条
			this.$nextTick(function () {
				_this.getMedia();
			});
		},
		getCommentList: function () {
			var _this = this;
			this.commentList = this.playData[this.currentPlayIndex].comment;
			this.commentStartTimer = setTimeout(function () {
				// 初始化进度条
				//_this.initProgress();
				if (_this.commentList.length > 3) {
					// 调用评论滚动方法
					_this.commentScroll();
				}
			},200);
		},
        commentScroll: function () {
        	if (this.commentList.length > 3) {
        		var	liObj = $('.comment-container ul li').eq(0),
        		    liH = parseInt(liObj.height()),
        		    liBottom = parseInt(liObj.css('margin-bottom')),
        		    _this = this,
        		    commentObj = null;
        		this.commentTimer = setInterval(function () {
        			commentObj = $('.comment-container ul');
        			commentObj.animate({
				        marginTop: -(liH + liBottom),
				    },1900 , function () {
				    	var commentItem = _this.commentList.shift();
				    	_this.commentList.push(commentItem);
				    	commentObj.css('margin-top', 0);
				    });
        		}, 2000);
        	}
        },
		checkTitleState: function () {
			if (this.currentPlayIndex > 0) {
				// 当 当前标题不等于上一个出现的标题时，则视为追加，标题再次出现
				if (this.playData[this.currentPlayIndex].title != this.playData[this.currentPlayIndex - 1].title) {
					if (this.playData[this.currentPlayIndex].title) {
						this.titleHandle();
					}
				}
			} else {
				if (this.playData[this.currentPlayIndex].title) {
					this.titleHandle();
				}
			}
		},
 		titleHandle: function () {
			var _this = this;
			this.isShowTitle = true;
			this.$nextTick(function () {
				var obj = $('.title-container').eq(0);
				obj.animate({
					opacity: 0,
				}, 3000, function () {
					_this.isShowTitle = false;
					obj.css('opacity', 1);
				});
			});
		},
		getTravelInfo: function () {
			// 赋值id
			this.travelId = this.shortTravelInfo.travelInfo.travelId;

			// 播放数据信息
			this.playData = this.shortTravelInfo.travelInfo.videos;
			this.playDataLength = this.playData.length;

			// 封面图地址
			// this.posterUrl = this.playData[this.currentPlayIndex].imgUrl;

			// 拍摄时间
			this.takeTime = this.playData[this.currentPlayIndex].takeTime;

			// 作者信息
			this.authName = this.shortTravelInfo.user.userName;
			this.authId = this.shortTravelInfo.user.uId;
			if (this.shortTravelInfo.user.avatar && this.shortTravelInfo.user.avatar.indexOf('usercenter') != -1) {
				this.shortTravelInfo.user.avatar = this.shortTravelInfo.user.avatar.replace('usercenter', 'userscenter');
			}
			this.authAvatar = this.shortTravelInfo.user.avatar || '/assets/images/detail/head_400X400.png';

			// 获取上次编辑的时间
			this.lastUpdateDate = this.shortTravelInfo.travelInfo.lastUpdateDate;
		},
		initProgress: function () {
			this.progressWidth = parseInt($('.progress-container').eq(0).width());

			// 之前播放我的进度条处理
			// for (var i = 0; i < this.currentPlayIndex; i++) {
			// 	this.recordProgress[i] = this.progressWidth;
			// }
			if (this.playDataLength > 1) {
				this.progressItemWidth = parseInt((this.progressWidth - (this.playDataLength - 1) * this.step) / this.playDataLength);
			} else {
				this.progressItemWidth = parseInt(this.progressWidth);
			}
		},
		setProgress: function (bool) {
			var currentPlayTime = this.recordProgress[this.currentPlayIndex];
			var _this = this;

			this.sTime = this.duration / this.progressItemWidth * 1000;
			clearInterval(this.timer);
			this.timer = setInterval(function () {
				++currentPlayTime;
				Vue.set(_this.recordProgress, _this.currentPlayIndex, currentPlayTime);
				if (_this.progressItemWidth <= currentPlayTime) {
					clearInterval(_this.timer);
				}
			}, _this.sTime);
		},
		initRecordProgress: function () {
			this.recordProgress = [];
			for (var i = 0; i < this.playDataLength; i++) {
				this.recordProgress.push(0);
			}
		},
		pauseMedia: function () {
			if (this.isPlay) {
				clearInterval(this.timer);
				this.mediaObj.pause();
				this.isPlay = false;
			}
		},
		playMedia: function () {
			clearTimeout(this.resizeTimer);
			this.mediaObj.play();
			this.setProgress();
		},
		replayMedia: function () {
			this.isLoading = true;
			this.isEnd = false;
			$(this.mediaObj).attr('autoplay',false);
			this.resetRemoveEvent();
			this.currentPlayIndex = 0;
			this.init();
		},
		getMedia: function () {
			var _this = this;
			this.mediaObj = document.getElementById('media');
			this.mediaObj.addEventListener('canplay', this.getDuration);
			this.mediaObj.addEventListener('play', this.playEvent);
			this.mediaObj.addEventListener('ended', this.endEvent);
		},
		getDuration: function () {
			var _this = this;
			this.isLoading = false;
			this.duration = this.mediaObj.duration;
			this.$nextTick(function () {
				if (_this.currentPlayIndex == 0) {
					_this.initProgress();
					_this.playMedia();
					$(_this.mediaObj).attr('autoplay',true);
				}
				_this.setProgress();
			});
		},
		endEvent: function () {
			this.resetRemoveEvent();
			this.isEnd = true;
			Vue.set(this.recordProgress, this.currentPlayIndex, this.progressItemWidth);
			if (this.playDataLength - 1 > this.currentPlayIndex) {
				this.currentPlayIndex++;
				this.isEnd = false;
				this.checkTitleState();
				this.resetAddEvent();
			} else {
				this.triggerNext();
			}
		},
		triggerPrev: function () {
			$(this.mediaObj).attr('autoplay',false);
			this.dataIndex--;
			this.isLoading = true;
			this.isEnd = false;
			this.resetRemoveEvent();
			this.currentPlayIndex = 0;
			this.init();
		},
		triggerNext: function () {
			if (this.dataListLen - 1 > this.dataIndex) {
				$(this.mediaObj).attr('autoplay',false);
				this.dataIndex++;
				this.isLoading = true;
				this.isEnd = false;
				this.resetRemoveEvent();
				this.currentPlayIndex = 0;
				this.init();
			}
		},
		resetAddEvent: function () {
			this.getCommentList();
			$('.comment-container ul').css('margin-top', 0);
			this.mediaObj.addEventListener('play', this.playEvent);
			this.mediaObj.addEventListener('ended', this.endEvent);
			this.mediaObj.addEventListener('canplay', this.getDuration);
		},
		resetRemoveEvent: function () {
			clearInterval(this.timer);
			clearTimeout(this.commentTimer);
			clearTimeout(this.resizeTimer);
			clearTimeout(this.commentStartTimer);
			$('.comment-container ul').css('margin-top', 0);
			this.mediaObj.removeEventListener('canplay', this.getDuration);
			this.mediaObj.removeEventListener('play', this.playEvent);
			this.mediaObj.removeEventListener('pause', this.pauseEvent);
			this.mediaObj.removeEventListener('ended', this.endEvent);
		},
		playEvent: function () {
			this.isPlay = true;
			this.mediaObj.removeEventListener('play', this.playEvent);
			this.mediaObj.addEventListener('pause', this.pauseEvent);
		},
		pauseEvent: function () {
			this.mediaObj.removeEventListener('pause', this.pauseEvent);
			this.mediaObj.addEventListener('play', this.playEvent);
		},
		triggerProgress: function (index) {
			this.resetRemoveEvent();
			this.currentPlayIndex = index;
			this.checkTitleState();
			for (var i = 0; i < this.playDataLength; i++) {
				if (i < index) {
					this.recordProgress[i] = this.progressItemWidth;
				} else if (i >= index){
					this.recordProgress[i] = 0;
				}
			}
			this.resetAddEvent();
		},
		resizeWindow: function () {
			var _this = this;
			$(window).resize(function () {
				clearTimeout(_this.resizeTimer);
				_this.pauseMedia();
				_this.initProgress();
				_this.resizeTimer = setTimeout(function () {
					var spanWidth = parseInt(_this.mediaObj.currentTime / _this.duration * _this.progressItemWidth);
					Vue.set(_this.recordProgress, _this.currentPlayIndex, spanWidth);
					_this.playMedia();
				},3000);
			});
		},
		showPause: function () {
			this.isShowPause = true;
		},
		hidePause: function () {
			this.isShowPause = false;
		}
	},
	created: function () {
		this.init();
		this.resizeWindow();
	}
});