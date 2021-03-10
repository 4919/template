var app = new Vue({
    el: '#app',
    data:{
        mode: 0,
        schoolList: [],
        schoolGroup: [],
        targetSchoolList: [],
        menuGroup:[],
        selectedSchoolGroup: '',
        selectedMenuGroup: '',
        todayMenuList:[]
    },
    created(){
        fetch('./data/school/school.csv')
            .then(res => res.text())
            .then(schoolList => (this.convertSchoolCsvToDictionary(schoolList)));

        // this.checkCookies();
        this.resetCookies();

    },
    methods:{
        resetCookies(){
            console.debug(this.$cookies.keys());
            for ( key in this.$cookies.keys()){
                this.$cookies.remove(key);
            }
        },
        checkCookies(){
            console.debug('checkCookies() ---->  ');
            this.$cookies.config(60 * 60 * 24 * 30,'');
            if (this.$cookies.isKey('schoolGroup') && this.$cookies.isKey('menuGroup')){
                this.mode = 2;
            };
        },
        convertSchoolCsvToDictionary(str){

            let lines = str.split('\r\n');
            lines.shift();
            let schoolList = [];

            for (let i = 0; i < lines.length; i++) {
                line = lines[i].split(',');

                let school = {}
                school.schoolGroup = line[0]
                school.menuGroup = line[1]
                school.schoolName = line[2]

                if (!(this.schoolGroup.includes(school.schoolGroup) )) {
                    this.schoolGroup.push(school.schoolGroup);
                }
                this.schoolList.push(school);
            }
        },
        convertMenuCsvToDictionary(str){
            console.debug(str);
            let lines = str.split('\r\n');
            line = Encoding.convert(lines, 'UNICODE', 'SJIS');
            console.debug(lines);
            // return lines
        },
        setSchoolGroup(group) {
            // 選択されたSchoolGroupをcookieにセットして描画のmodeを変更する.
            console.debug('setSchoolGroup() ---->  ', group, this.targetSchoolList);
            this.$cookies.set('schoolGroup', group);
            this.mode = 1;

            this. setSchoolCandidateList()
        },
        setSchoolCandidateList() {
            console.debug('setSchoolCandidateList() ---->  ');
            this.targetSchoolList = this.schoolList.filter( item => item.schoolGroup === this.$cookies.get('schoolGroup'));
            let menuGroup = this.targetSchoolList.map(function(row){
                return row["menuGroup"]
            })
            this.menuGroup = [...new Set(menuGroup)]
            console.debug(this.targetSchoolList)
        },
        setUserSettingsToCookie(schoolName, menuGroup){
            console.debug('setUserSettingsToCookie() ----> ', schoolName, menuGroup);
            this.$cookies.set('schoolNamep', schoolName);
            this.$cookies.set('menuGroup', menuGroup);
            this.mode = 2;

            this.getMenuCsvFile();
        },
        getMenuCsvFile(){
            // cookieから表示するcsvのデータを選択して保存する。
            // 生駒市の場合:
            // ex) ea-kondate2103.csv (2021年3月の小学校A献立)
            //    　・小学校 => e
            //      ・A献立 => a, B献立 => b
            //      
            // ex) j-kondate2103.csv (2021年3月の中学校献立)
            //      ・中学校 => j
            //      ・献立は１種類のみ
            let targetCsv = '';

            if (this.$cookies.get('schoolGroup') == '小学校') {
                targetCsv += ('e' + this.$cookies.get('menuGroup').toLowerCase() + '-');
            }else {
                targetCsv += 'j-';
            }

            targetCsv += 'kondate' + this.getFormatedDate('csv') + '.csv'

            // Shift_JISで エンコードする
            fetch('./data/menu/' + targetCsv)
                .then(res => {
                    reader = new FileReader();
                    reader.readAsBinaryString(res);
                    reader.onload = function (event) {
                        let result = event.target.result;
                        let utf8Array = Encoding.convert(result, 'UTF8', 'SJIS');
                        result = Encoding.codeToString(utf8Array);
                        console.log(result); //csvデータ(string)
                    }
                });

            // console.debug('', menuList)
        },
        convertShiftJisToUtf8(res){
            console.log(res);
            reader = new FileReader();
            reader.readAsBinaryString(res);
            reader.onload = function(event) {

                var result = event.target.result;
                var sjisArray = str2Array(result);
                var uniArray = Encoding.convert(sjisArray, 'UTF8', 'AUTO');
                var result = Encoding.codeToString(uniArray);
                console.log(result); //csvデータ(string)
            }
        }
        ,
        getFormatedDate(mode){
            // 生駒市が提供しているcsvファイルの命名規則で 年月 が 2021年3月の場合 2103 
            // のように表現されるためそのフォーマットで日付文字列を返す。
            let date = new Date()
            let formatedStringDate = '';

            const year = date.getFullYear().toString();
            let month = (date.getMonth() + 1).toString();

            // 1 : csvファイル名フォーマット
            // 2 : 献立取得用フォーマット
            if (mode == 'csv') {
                if (month.length == 1) {
                    month = '0' + month
                }
                formatedStringDate = (year.slice(2,4) + month)
            } else if (mode == 'menu'){
                const day = date.getDate().toString();
                formatedStringDate = year + '/' + month + '/' + day
            }

            return formatedStringDate
        }
    },
    computed: {
        isSchoolGroupSelectorShown: function() {
            return this.mode == 0;
        },
        isMenuGroupSelectorShown: function(){
            return this.mode == 1;
        },
        isDailyMenuShown: function() {
            return this.mode == 2;
        }
    }
});
 


// var array = { '小学校': [
//     { 'A': ['あすか野小学校','生駒南二小学校','生駒北小学校','生駒南小学校','壱分小学校','真弓小学校','鹿ノ台小学校','生駒台小学校','俵口小学校','生駒東小学校','生駒小学校'] },
//     { 'B': ['桜ヶ丘小学校','生駒台小学校','俵口小学校','生駒東小学校生駒小学校桜ヶ丘小学校'] }],
//     '中学校': [
//     { 'A': ['生駒中学校','生駒南中学校','生駒北中学校','緑ヶ丘中学校','鹿ノ台中学校','上中学校','光明中学校','大瀬中学校'] }]
// }