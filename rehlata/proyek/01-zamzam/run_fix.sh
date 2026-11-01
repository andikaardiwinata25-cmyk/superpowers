cd /home/user/superpowers/rehlata/proyek/01-zamzam
for i in 13 8 9 10; do
  echo "== scene $i start $(date +%T)"
  /opt/bvenv/bin/python blend3d.py $i frames frames/s$(printf %02d $i) > frames/logfix$i.txt 2>&1
  echo "== scene $i done $(date +%T) frames=$(ls frames/s$(printf %02d $i)/*.jpg | wc -l) err=$(grep -c Traceback frames/logfix$i.txt)"
done
echo ALLDONE
